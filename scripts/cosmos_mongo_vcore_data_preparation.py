"""Data Preparation Script for an Azure Cognitive Search Index."""
import argparse
import dataclasses
import json
import os
import subprocess
import uuid

import requests
import time
from data_utils import Document
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.identity import AzureCliCredential
from azure.search.documents import SearchClient
from pymongo.mongo_client import MongoClient
from tqdm import tqdm
from typing import Dict, List, Optional, Any

from data_utils import chunk_directory

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

def check_if_cosmos_mongo_db_exists(
    account_name: str,
    database_name: str,
    subscription_id: str,
    resource_group: str,
    credential = None):
    """_summary_

    Args:
        account_name (str): _description_
        database_name (str): _description_
        subscription_id (str): _description_
        resource_group (str): _description_
        credential: Azure credential to use for getting acs instance
    """
    if credential is None:
        raise ValueError("credential cannot be None")
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/resourceGroups/{resource_group}/providers/Microsoft.DocumentDB"
        f"/mongoClusters/{account_name}?api-version=2023-03-01-preview"
    )
    # url = (
    #     f"https://management.azure.com/subscriptions/{subscription_id}"
    #     f"/resourceGroups/{resource_group}/providers/Microsoft.DocumentDB/databaseAccounts"
    #     f"/{account_name}/mongoClusters/{database_name}?api-version=2023-03-01-preview"
    # )    

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {credential.get_token('https://management.azure.com/.default').token}",
    }

    response = requests.get(url, headers=headers)
    return response.status_code == 200

def create_cosmos_mongo_db(
    account_name: str,
    database_name: str,
    subscription_id: str,
    resource_group: str,
    location: str,
    credential = None,
):
    """_summary_

    Args:
        account_name (str): _description_
        database_name (str): _description_
        subscription_id (str): _description_
        resource_group (str): _description_
        location (str): _description_
        credential: Azure credential to use for creating acs instance

    Raises:
        Exception: _description_
    """
    if credential is None:
        raise ValueError("credential cannot be None")
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/resourceGroups/{resource_group}/providers/Microsoft.DocumentDB/databaseAccounts"
        f"/{account_name}/mongodbDatabases/{database_name}?api-version=2023-03-15"
    )

    payload = {
        "type": "Microsoft.DocumentDB/databaseAccounts/mongodbDatabases",
        "location": f"{location}",
        "properties": {
            "id": f"{database_name}",
            "name": f"{database_name}"
        },
        "options": {}
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {credential.get_token('https://management.azure.com/.default').token}",
    }

    response = requests.put(url, json=payload, headers=headers)
    if response.status_code != 200:
        raise Exception(
            f"Failed to create cosmos mongo vcore database. Error: {response.text}")

def check_if_cosmos_mongo_db_collection_exists(
    account_name: str,
    database_name: str,
    collection_name: str,
    subscription_id: str,
    resource_group: str,
    credential = None):
    """_summary_

    Args:
        account_name (str): _description_
        database_name (str): _description_        
        collection_name (str): _description_
        subscription_id (str): _description_
        resource_group (str): _description_
        credential: Azure credential to use for getting acs instance
    """
    if credential is None:
        raise ValueError("credential cannot be None")
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/resourceGroups/{resource_group}/providers/Microsoft.DocumentDB/databaseAccounts"
        f"/{account_name}/mongodbDatabases/{database_name}"
        f"/collections/{collection_name}?api-version=2023-03-15"
    )

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {credential.get_token('https://management.azure.com/.default').token}",
    }

    response = requests.get(url, headers=headers)
    return response.status_code == 200

def create_cosmos_mongo_db_collection(
    account_name: str,
    database_name: str,
    collection_name: str,    
    subscription_id: str,
    resource_group: str,
    location: str,
    credential = None,
):
    """_summary_

    Args:
        account_name (str): _description_
        database_name (str): _description_
        collection_name (str): _description_
        subscription_id (str): _description_
        resource_group (str): _description_
        location (str): _description_
        credential: Azure credential to use for creating acs instance

    Raises:
        Exception: _description_
    """
    if credential is None:
        raise ValueError("credential cannot be None")
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/resourceGroups/{resource_group}/providers/Microsoft.DocumentDB/databaseAccounts"
        f"/{account_name}/mongodbDatabases/{database_name}"
        f"/collections/{collection_name}?api-version=2023-03-15"
    )

    payload = {
        "name": f"{collection_name}",
        "type": "Microsoft.DocumentDB/databaseAccounts/mongodbDatabases/mongodbCollections",
        "location": f"{location}",
        "properties": {
            "resource": {            
                "id": f"{collection_name}"
            }
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {credential.get_token('https://management.azure.com/.default').token}",
    }

    response = requests.put(url, json=payload, headers=headers)
    if response.status_code != 200:
        raise Exception(
            f"Failed to create cosmos mongo vcore database collection. Error: {response.text}")

def get_cosmos_mongo_db_connection_string(
    account_name: str,
    database_name: str,
    subscription_id: str,
    resource_group: str,
    credential = None) -> str:
    """_summary_

    Args:
        account_name (str): _description_
        database_name (str): _description_
        subscription_id (str): _description_
        resource_group (str): _description_
        credential: Azure credential to use for getting acs instance
    """
    if credential is None:
        raise ValueError("credential cannot be None")
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/resourceGroups/{resource_group}/providers/Microsoft.DocumentDB/databaseAccounts"
        f"/{account_name}/listConnectionStrings?api-version=2023-03-15"
    )

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {credential.get_token('https://management.azure.com/.default').token}",
    }

    response = requests.post(url, headers=headers)
    if response.status_code == 200:
        return response.text.get("connectionStrings")[0].get("connectionString")
    else:
        raise Exception(
            f"Failed to get connection string of cosmos database {database_name}.")

def create_or_update_vector_search_index(
        mongo_client: MongoClient,
        database_name: str,
        collection_name: str,
        index_name,
        vector_field, 
        credential, 
        language):
    if credential is None:
        raise ValueError("credential cannot be None")

    try:
        dbs=mongo_client.list_database_names()
        if (database_name in dbs):
            print(f"database {database_name} exist")
            collections=mongo_client[database_name].list_collection_names()
            if (collection_name in collections):
                print(f"collection {collection_name} exist")

        mongo_collection = mongo_client[database_name][collection_name]  
        indexes = mongo_collection.index_information()
        if (indexes.get(index_name) == None):
            # Ensure the vector index exists.
            indexDefs:List[any] = [
                { "name": index_name, "key": { vector_field: "cosmosSearch" }, "cosmosSearchOptions": { "kind": "vector-ivf", "similarity": "COS", "dimensions": 1536 } }
            ]
            mongo_client[database_name].command("createIndexes", collection_name, indexes = indexDefs)
    except Exception as e:
        raise Exception(
            f"Failed to create vector index {index_name} for collection {collection_name} under database {database_name}. Error: {str(e)}")
    return True

def initialize_mongo_client(
        account_name: str,
        database_name: str,
        subscription_id, 
        resource_group) -> MongoClient:
    conn_string = "<connstr>"
    # conn_string = get_cosmos_mongo_db_connection_string(account_name, database_name, subscription_id, resource_group, credential)
    return MongoClient(conn_string)
     
def upsert_documents_to_index(
        mongo_client: MongoClient,
        database_name: str,
        collection_name: str,
        docs: List[Document]
        ):
    for document in docs:
        finalDocChunk:dict = {}
        finalDocChunk["_id"] = f"doc:{uuid.uuid4()}"
        finalDocChunk['title'] = document.title
        finalDocChunk["filepath"] = document.filepath
        finalDocChunk["url"] = document.url
        finalDocChunk["content"] = document.content
        finalDocChunk["contentvector"] = document.contentVector
        finalDocChunk["metadata"] = document.metadata

        mongo_collection = mongo_client[database_name][collection_name]

        try:
            mongo_collection.insert_one(finalDocChunk)
            print(f"Upsert doc chunk {document.id} successfully")
        
        except Exception as e:
            print(f"Failed to upsert doc chunk {document.id}")
            continue

def validate_index(
        mongo_client: MongoClient,
        database_name: str,
        collection_name: str,
        index_name,
        vector_field, 
        credential, 
        language):
    if credential is None:
        raise ValueError("credential cannot be None")

    try:
        mongo_collection = mongo_client[database_name][collection_name]  
        indexes = mongo_collection.index_information()
        if (indexes.get(index_name) == None):
            raise Exception(
                f"Failed to create vector index {index_name} for collection {collection_name} under database {database_name}. Error: {str(e)}")

            # Ensure the vector index exists.
    except Exception as e:
        raise Exception(
            f"Failed to create vector index {index_name} for collection {collection_name} under database {database_name}. Error: {str(e)}")  

def create_index(config, credential, form_recognizer_client=None, embedding_model_endpoint=None, use_layout=False, njobs=4):
    account_name = config["account_name"]
    database_name = config["database_name"]
    collection_name = config["collection_name"]
    subscription_id = config["subscription_id"]
    resource_group = config["resource_group"]
    location = config["location"]
    index_name = config["index_name"]
    vector_field = config["vector_field"]
    language = config.get("language", None)

    if language and language not in SUPPORTED_LANGUAGE_CODES:
        raise Exception(f"ERROR: Ingestion does not support {language} documents. "
                        f"Please use one of {SUPPORTED_LANGUAGE_CODES}."
                        f"Language is set as two letter code for e.g. 'en' for English."
                        f"If you donot want to set a language just remove this prompt config or set as None")


    # check if cosmos mongo vcore database exists, create if not
    if check_if_cosmos_mongo_db_exists(account_name, database_name, subscription_id, resource_group, credential):
        print(f"Using existing cosmos vcore database {database_name}")
    else:
        print(f"Creating cosmos vcore database {database_name}")
        # create_cosmos_mongo_db(account_name, database_name, subscription_id, resource_group, location, credential=credential)

    # Initialize Mongo Client
    mongo_client = initialize_mongo_client(account_name, database_name, subscription_id, resource_group)

    # create or update vector search index with compatible schema
    if not create_or_update_vector_search_index(mongo_client, database_name, collection_name, index_name, vector_field, credential, language):
        raise Exception(f"Failed to create or update index {index_name}")
    
    # chunk directory
    print("Chunking directory...")
    add_embeddings = True

    result = chunk_directory(config["data_path"], num_tokens=config["chunk_size"], token_overlap=config.get("token_overlap",0),
                             azure_credential=credential, form_recognizer_client=form_recognizer_client, use_layout=use_layout, njobs=njobs,
                             add_embeddings=add_embeddings, embedding_endpoint=embedding_model_endpoint)

    if len(result.chunks) == 0:
        raise Exception("No chunks found. Please check the data path and chunk size.")

    print(f"Processed {result.total_files} files")
    print(f"Unsupported formats: {result.num_unsupported_format_files} files")
    print(f"Files with errors: {result.num_files_with_errors} files")
    print(f"Found {len(result.chunks)} chunks")

    # upsert documents to index
    print("Upserting documents to index...")
    upsert_documents_to_index(mongo_client, database_name, collection_name, result.chunks)

    # check if index is ready/validate index
    print("Validating index...")
    #validate_index(service_name, subscription_id, resource_group, index_name)
    print("Index validation completed")

def valid_range(n):
    n = int(n)
    if n < 1 or n > 32:
        raise argparse.ArgumentTypeError("njobs must be an Integer between 1 and 32.")
    return n

if __name__ == "__main__": 
    parser = argparse.ArgumentParser()
    parser.add_argument("--cosmos-config", type=str, help="Path to config file containing settings for data preparation")
    parser.add_argument("--form-rec-resource", type=str, help="Name of your Form Recognizer resource to use for PDF cracking.")
    parser.add_argument("--form-rec-key", type=str, help="Key for your Form Recognizer resource to use for PDF cracking.")
    parser.add_argument("--form-rec-use-layout", default=False, action='store_true', help="Whether to use Layout model for PDF cracking, if False will use Read model.")
    parser.add_argument("--njobs", type=valid_range, default=4, help="Number of jobs to run (between 1 and 32). Default=4")
    parser.add_argument("--embedding-model-endpoint", type=str, help="Endpoint for the embedding model to use for vector search. Format: 'https://<AOAI resource name>.openai.azure.com/openai/deployments/<Ada deployment name>/embeddings?api-version=2023-03-15-preview'")
    parser.add_argument("--embedding-model-key", type=str, help="Key for the embedding model to use for vector search.")
    args = parser.parse_args()

    with open(args.cosmos_config) as f:
        config = json.load(f)

    credential = AzureCliCredential()
    form_recognizer_client = None

    print("Data preparation script started")
    if args.form_rec_resource and args.form_rec_key:
        os.environ["FORM_RECOGNIZER_ENDPOINT"] = f"https://{args.form_rec_resource}.cognitiveservices.azure.com/"
        os.environ["FORM_RECOGNIZER_KEY"] = args.form_rec_key
        if args.njobs==1:
            form_recognizer_client = DocumentAnalysisClient(endpoint=f"https://{args.form_rec_resource}.cognitiveservices.azure.com/", credential=AzureKeyCredential(args.form_rec_key))
        print(f"Using Form Recognizer resource {args.form_rec_resource} for PDF cracking, with the {'Layout' if args.form_rec_use_layout else 'Read'} model.")

    for index_config in config:        
        if index_config.get("index_name") and not args.embedding_model_endpoint:
            raise Exception("ERROR: Vector search is enabled in the config, but no embedding model endpoint and key were provided. Please provide these values or disable vector search.")
        print("Preparing data for index:", index_config["index_name"])

        create_index(index_config, credential, form_recognizer_client, embedding_model_endpoint=args.embedding_model_endpoint, use_layout=args.form_rec_use_layout, njobs=args.njobs)
        print("Data preparation for index", index_config["index_name"], "completed")

    print(f"Data preparation script completed. {len(config)} indexes updated.")