import json
import os
import requests
import subprocess
import time
from abc import ABC, abstractmethod
from azure.core.credentials import AzureKeyCredential
from azure.identity import AzureCliCredential
from azure.search.documents import SearchClient
from dataclasses import dataclass, asdict
from data_utils import chunk_directory
from elasticsearch import Elasticsearch
from elasticsearch.helpers import parallel_bulk
from enum import Enum
from tqdm import tqdm


class IndexType(Enum):
    AzureCognitiveSearch = 0
    Elasticsearch = 1
    

@dataclass(kw_only=True)
class IndexConfig:
    index_type: str
    data_path: str
    index_name: str
    chunk_size: int = 1024
    token_overlap: int = 0
    language: str = "en"
    

@dataclass(kw_only=True)
class AzureCognitiveSearchIndexConfig(IndexConfig):
    location: str
    subscription_id: str
    resource_group: str
    search_service_name: str
    vector_config_name: str = None
    semantic_config_name: str = "default"
    

@dataclass(kw_only=True)
class ElasticsearchIndexConfig(IndexConfig):
    elasticsearch_endpoint: str
    elasticsearch_api_key: str
    elasticsearch_api_key_id: str
    add_aoai_embeddings: bool = False
    
    
class BaseIndexer(ABC):
    @abstractmethod
    def create_index(self, form_recognizer_client, use_layout, njobs):
        pass
    
    @abstractmethod
    def create_or_update_search_index(self):
        pass
    
    @abstractmethod
    def upload_documents_to_index(self, docs, upload_batch_size = 50):
        pass
    
    @abstractmethod
    def validate_index():
        pass
    

class AzureCognitiveSearchIndexer(BaseIndexer):
    SUPPORTED_LANGUAGE_CODES = {
        "ar": "Arabic",
        "hy": "Armenian",
        "eu": "Basque",
        "bg": "Bulgarian",
        "ca": "Catalan",
        "zh-Hans": "Chinese Simplified",
        "zh-Hant": "Chinese Traditional",
        "cs": "Czech",
        "da": "Danish",
        "nl": "Dutch",
        "en": "English",
        "fi": "Finnish",
        "fr": "French",
        "gl": "Galician",
        "de": "German",
        "el": "Greek",
        "hi": "Hindi",
        "hu": "Hungarian",
        "id": "Indonesian (Bahasa)",
        "ga": "Irish",
        "it": "Italian",
        "ja": "Japanese",
        "ko": "Korean",
        "lv": "Latvian",
        "no": "Norwegian",
        "fa": "Persian",
        "pl": "Polish",
        "pt-Br": "Portuguese (Brazil)",
        "pt-Pt": "Portuguese (Portugal)",
        "ro": "Romanian",
        "ru": "Russian",
        "es": "Spanish",
        "sv": "Swedish",
        "th": "Thai",
        "tr": "Turkish"
    }
    def __init__(self, index_config: AzureCognitiveSearchIndexConfig):
        self.data_path = index_config.data_path
        self.index_name = index_config.index_name
        self.chunk_size = index_config.chunk_size
        self.token_overlap = index_config.token_overlap
        self.language = index_config.language
        self.location = index_config.location
        self.subscription_id = index_config.subscription_id
        self.resource_group = index_config.resource_group
        self.search_service_name = index_config.search_service_name
        self.semantic_config_name = index_config.semantic_config_name
        self.vector_config_name = index_config.vector_config_name
        
        self.credential = AzureCliCredential()
    
    def create_index(self, form_recognizer_client, use_layout, njobs):
        if self.language and self.language not in self.SUPPORTED_LANGUAGE_CODES:
            raise Exception(f"ERROR: Ingestion does not support {self.language} documents. "
                            f"Please use one of {self.SUPPORTED_LANGUAGE_CODES}."
                            f"Language is set as two letter code for e.g. 'en' for English."
                            f"If you donot want to set a language just remove this prompt config or set as None")


        # check if search service exists, create if not
        if self.check_if_search_service_exists():
            print(f"Using existing search service {self.search_service_name}")
        else:
            print(f"Creating search service {self.search_service_name}")
            self.create_search_service()

        # create or update search index with compatible schema
        if not self.create_or_update_search_index():
            raise Exception(f"Failed to create or update index {self.index_name}")
        
        # chunk directory
        print("Chunking directory...")
        add_embeddings = False
        if self.vector_config_name and os.environ.get("EMBEDDING_MODEL_ENDPOINT") and os.environ.get("EMBEDDING_MODEL_KEY"):
            add_embeddings = True
        result = chunk_directory(
            self.data_path,
            num_tokens=self.chunk_size,
            token_overlap=self.token_overlap,
            form_recognizer_client=form_recognizer_client,
            use_layout=use_layout,
            njobs=njobs,
            add_embeddings=add_embeddings
        )

        if len(result.chunks) == 0:
            raise Exception("No chunks found. Please check the data path and chunk size.")

        print(f"Processed {result.total_files} files")
        print(f"Unsupported formats: {result.num_unsupported_format_files} files")
        print(f"Files with errors: {result.num_files_with_errors} files")
        print(f"Found {len(result.chunks)} chunks")

        # upload documents to index
        print("Uploading documents to index...")
        self.upload_documents_to_index(result.chunks)

        # check if index is ready/validate index
        print("Validating index...")
        self.validate_index()
        print("Index validation completed")
    
    
    def upload_documents_to_index(self, docs, upload_batch_size = 50):
        if self.credential is None:
            raise ValueError("credential cannot be None")
        
        to_upload_dicts = []

        id = 0
        for document in docs:
            d = asdict(document)
            # add id to documents
            d.update({"@search.action": "upload", "id": str(id)})
            if "contentVector" in d and d["contentVector"] is None:
                del d["contentVector"]
            to_upload_dicts.append(d)
            id += 1
        
        endpoint = "https://{}.search.windows.net/".format(self.search_service_name)
        admin_key = json.loads(
            subprocess.run(
                f"az search admin-key show --subscription {self.subscription_id} --resource-group {self.resource_group} --service-name {self.search_service_name}",
                shell=True,
                capture_output=True,
            ).stdout
        )["primaryKey"]

        search_client = SearchClient(
            endpoint=endpoint,
            index_name=self.index_name,
            credential=AzureKeyCredential(admin_key),
        )
        # Upload the documents in batches of upload_batch_size
        for i in tqdm(range(0, len(to_upload_dicts), upload_batch_size), desc="Indexing Chunks..."):
            batch = to_upload_dicts[i: i + upload_batch_size]
            results = search_client.upload_documents(documents=batch)
            num_failures = 0
            errors = set()
            for result in results:
                if not result.succeeded:
                    print(f"Indexing Failed for {result.key} with ERROR: {result.error_message}")
                    num_failures += 1
                    errors.add(result.error_message)
            if num_failures > 0:
                raise Exception(f"INDEXING FAILED for {num_failures} documents. Please recreate the index."
                                f"To Debug: PLEASE CHECK chunk_size and upload_batch_size. \n Error Messages: {list(errors)}")
    
    def validate_index(self):
        api_version = "2021-04-30-Preview"
        admin_key = json.loads(
            subprocess.run(
                f"az search admin-key show --subscription {self.subscription_id} --resource-group {self.resource_group} --service-name {self.search_service_name}",
                shell=True,
                capture_output=True,
            ).stdout
        )["primaryKey"]

        headers = {
            "Content-Type": "application/json", 
            "api-key": admin_key}
        params = {"api-version": api_version}
        url = f"https://{self.search_service_name}.search.windows.net/indexes/{self.index_name}/stats"
        for retry_count in range(5):
            response = requests.get(url, headers=headers, params=params)

            if response.status_code == 200:
                response = response.json()
                num_chunks = response['documentCount']
                if num_chunks==0 and retry_count < 4:
                    print("Index is empty. Waiting 60 seconds to check again...")
                    time.sleep(60)
                elif num_chunks==0 and retry_count == 4:
                    print("Index is empty. Please investigate and re-index.")
                else:
                    print(f"The index contains {num_chunks} chunks.")
                    average_chunk_size = response['storageSize']/num_chunks
                    print(f"The average chunk size of the index is {average_chunk_size} bytes.")
                    break
            else:
                if response.status_code==404:
                    print(f"The index does not seem to exist. Please make sure the index was created correctly, and that you are using the correct service and index names")
                elif response.status_code==403:
                    print(f"Authentication Failure: Make sure you are using the correct key")
                else:
                    print(f"Request failed. Please investigate. Status code: {response.status_code}")
                break
    
    def check_if_search_service_exists(self):
        if self.credential is None:
            raise ValueError("credential cannot be None")
        url = (
            f"https://management.azure.com/subscriptions/{self.subscription_id}"
            f"/resourceGroups/{self.resource_group}/providers/Microsoft.Search/searchServices"
            f"/{self.search_service_name}?api-version=2021-04-01-preview"
        )

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.credential.get_token('https://management.azure.com/.default').token}",
        }

        response = requests.get(url, headers=headers)
        return response.status_code == 200
    
    def create_search_service(
        self,
        sku: str = "standard"
    ):
        """_summary_

        Args:
            search_service_name (str): _description_
            subscription_id (str): _description_
            resource_group (str): _description_
            location (str): _description_
            credential: Azure credential to use for creating acs instance

        Raises:
            Exception: _description_
        """
        if self.credential is None:
            raise ValueError("credential cannot be None")
        url = (
            f"https://management.azure.com/subscriptions/{self.subscription_id}"
            f"/resourceGroups/{self.resource_group}/providers/Microsoft.Search/searchServices"
            f"/{self.search_service_name}?api-version=2021-04-01-preview"
        )

        payload = {
            "location": f"{self.location}",
            "sku": {"name": sku},
            "properties": {
                "replicaCount": 1,
                "partitionCount": 1,
                "hostingMode": "default",
                "semanticSearch": "free",
            },
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.credential.get_token('https://management.azure.com/.default').token}",
        }

        response = requests.put(url, json=payload, headers=headers)
        if response.status_code != 201:
            raise Exception(
                f"Failed to create search service. Error: {response.text}")
            
    def create_or_update_search_index(self):
        if self.credential is None:
            raise ValueError("credential cannot be None")
        admin_key = json.loads(
            subprocess.run(
                f"az search admin-key show --subscription {self.subscription_id} --resource-group {self.resource_group} --service-name {self.search_service_name}",
                shell=True,
                capture_output=True,
            ).stdout
        )["primaryKey"]

        url = f"https://{self.search_service_name}.search.windows.net/indexes/{self.index_name}?api-version=2023-07-01-Preview"
        headers = {
            "Content-Type": "application/json",
            "api-key": admin_key,
        }

        body = {
            "fields": [
                {
                    "name": "id",
                    "type": "Edm.String",
                    "searchable": True,
                    "key": True,
                },
                {
                    "name": "content",
                    "type": "Edm.String",
                    "searchable": True,
                    "sortable": False,
                    "facetable": False,
                    "filterable": False,
                    "analyzer": f"{self.language}.lucene" if self.language else None,
                },
                {
                    "name": "title",
                    "type": "Edm.String",
                    "searchable": True,
                    "sortable": False,
                    "facetable": False,
                    "filterable": False,
                    "analyzer": f"{self.language}.lucene" if self.language else None,
                },
                {
                    "name": "filepath",
                    "type": "Edm.String",
                    "searchable": True,
                    "sortable": False,
                    "facetable": False,
                    "filterable": False,
                },
                {
                    "name": "url",
                    "type": "Edm.String",
                    "searchable": True,
                },
                {
                    "name": "metadata",
                    "type": "Edm.String",
                    "searchable": True,
                },
            ],
            "suggesters": [],
            "scoringProfiles": [],
            "semantic": {
                "configurations": [
                    {
                        "name": self.semantic_config_name,
                        "prioritizedFields": {
                            "titleField": {"fieldName": "title"},
                            "prioritizedContentFields": [{"fieldName": "content"}],
                            "prioritizedKeywordsFields": [],
                        },
                    }
                ]
            },
        }

        if self.vector_config_name:
            body["fields"].append({
                "name": "contentVector",
                "type": "Collection(Edm.Single)",
                "searchable": True,
                "retrievable": True,
                "dimensions": 1536,
                "vectorSearchConfiguration": "default"
            })

            body["vectorSearch"] = {
                "algorithmConfigurations": [
                    {
                        "name": self.vector_config_name,
                        "kind": "hnsw"
                    }
                ]
            }

        response = requests.put(url, json=body, headers=headers)
        if response.status_code == 201:
            print(f"Created search index {self.index_name}")
        elif response.status_code == 204:
            print(f"Updated existing search index {self.index_name}")
        else:
            raise Exception(f"Failed to create search index. Error: {response.text}")
        
        return True
    

class ElasticsearchIndexer(BaseIndexer):
    def __init__(self, index_config: ElasticsearchIndexConfig):
        self.data_path = index_config.data_path
        self.index_name = index_config.index_name
        self.chunk_size = index_config.chunk_size
        self.token_overlap = index_config.token_overlap
        self.language = index_config.language
        self.elasticsearch_endpoint = index_config.elasticsearch_endpoint
        self.elasticsearch_api_key = index_config.elasticsearch_api_key
        self.elasticsearch_api_key_id = index_config.elasticsearch_api_key_id
        self.add_aoai_embeddings = index_config.add_aoai_embeddings
                
        self.elasticsearch_client = Elasticsearch(
            self.elasticsearch_endpoint,
            api_key=(self.elasticsearch_api_key_id, self.elasticsearch_api_key),
            verify_certs=True,
            request_timeout=300
        )
    
    def create_index(self, form_recognizer_client, use_layout, njobs):
        if self.add_aoai_embeddings and not (os.environ.get("EMBEDDING_MODEL_ENDPOINT") and os.environ.get("EMBEDDING_MODEL_KEY")):
            raise Exception("ERROR: Vector search is enabled in the config, but no embedding model endpoint and key were provided. Please provide these values or disable vector search.")

        # create or update search index with compatible schema
        if not self.create_or_update_search_index():
            raise Exception(f"Failed to create or update index {self.index_name}")
        
        # chunk directory
        print("Chunking directory...")
        
        result = chunk_directory(
            self.data_path,
            num_tokens=self.chunk_size,
            token_overlap=self.token_overlap,
            form_recognizer_client=form_recognizer_client,
            use_layout=use_layout,
            njobs=njobs,
            add_embeddings=self.add_aoai_embeddings
        )

        if len(result.chunks) == 0:
            raise Exception("No chunks found. Please check the data path and chunk size.")

        print(f"Processed {result.total_files} files")
        print(f"Unsupported formats: {result.num_unsupported_format_files} files")
        print(f"Files with errors: {result.num_files_with_errors} files")
        print(f"Found {len(result.chunks)} chunks")

        # upload documents to index
        print("Uploading documents to index...")
        self.upload_documents_to_index(result.chunks)

        # check if index is ready/validate index
        print("Validating index...")
        self.validate_index()
    
    def create_or_update_search_index(self):
        mappings = {
            "properties": {
                "id": {
                    "type": "text"
                },
                "content": {
                    "type": "text"
                },
                "title": {
                    "type": "text"
                },
                "filepath": {
                    "type": "text"
                },
                "url": {
                    "type": "text"
                },
                "metadata": {
                    "type": "text"
                }
            }
        }
        
        if self.add_aoai_embeddings:
            mappings["properties"]["contentVector"] = {
                "type": "dense_vector",
                "dims": 1536,
                "index": True,
                "similarity": "cosine"
            }
        
        try:
            if self.elasticsearch_client.indices.exists(index=self.index_name):
                return self.elasticsearch_client.indices.put_mapping(index=self.index_name, mappings=mappings)
                
            return self.elasticsearch_client.indices.create(index=self.index_name, mappings=mappings)
        
        except Exception as exc:
            self.handle_client_error(exc)
    
    def upload_documents_to_index(self, docs, upload_batch_size = 50):
        docs_generator = (
            {
                "_index": self.index_name,
                "_id": doc.id,
                **asdict(doc)
            } for doc in docs
        )
        # Upload the documents in batches of upload_batch_size
        print(f"Uploading {len(docs)} document chunks to index.")
        for i in tqdm(range(0, len(docs), upload_batch_size), desc="Indexing Chunks..."):
            try:
                results = parallel_bulk(
                    self.elasticsearch_client,
                    docs_generator,
                    chunk_size=upload_batch_size
                )
            except Exception as exc:
                self.handle_client_error(exc)
                
            num_failures = 0
            errors = set()
            for (success, info) in results:
                if not success:
                    print(f"Indexing Failed on batch {i} with error: {info}")
                    num_failures += 1
                    errors.add(info)
            if num_failures > 0:
                raise Exception(f"INDEXING FAILED for {num_failures} documents. Please recreate the index."
                                f"To Debug: PLEASE CHECK chunk_size and upload_batch_size. \n Error Messages: {list(errors)}")
    
    def validate_index(self):
        try:
            index_stats = self.elasticsearch_client.indices.stats(index=self.index_name)
        
        except Exception as exc:
            self.handle_client_error(exc)
            
        num_chunks = index_stats.body["_all"]["primaries"]["docs"]["count"]
        print(f"Total document chunks in index: {num_chunks}")
        
    def handle_client_error(self, exc: Exception):
        # handle API errors
        if hasattr(exc, "error"):
            error_message = f"{exc.status_code}: {exc.error}"
        
        # handle transport errors
        elif hasattr(exc, "errors"):
            error_message = f"{exc.errors[0].status}: {exc.message}"
                    
        else:
            error_message = str(exc)
            
        raise Exception(error_message)


class IndexerFactory:
    @staticmethod
    def create_indexer(index_config_dict: dict):
        if "index_type" in index_config_dict.keys():
            if index_config_dict["index_type"] == IndexType.AzureCognitiveSearch.name:
                return AzureCognitiveSearchIndexer(
                    AzureCognitiveSearchIndexConfig(**index_config_dict)
                )
        
            elif index_config_dict["index_type"] == IndexType.Elasticsearch.name:
                return ElasticsearchIndexer(
                    ElasticsearchIndexConfig(**index_config_dict)
                )
        
            raise NotImplementedError(f"Index type '{index_config_dict['index_type']}' is not supported.")
        
        else:
            raise ValueError("Config is missing property 'index_type'.")
