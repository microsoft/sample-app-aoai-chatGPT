"""Data Preparation Script for an Azure Cognitive Search Index."""
import argparse
import json
import os
import time
import uuid
import pinecone

import requests
from data_utils import Document
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.identity import AzureCliCredential

from typing import List

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

def check_if_pinecone_environment_exists(
    environment: str,
    api_key: str,
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
    try:
        pinecone.init(api_key=api_key, environment=environment)
    except:
        raise BaseException("Invalid env or key")

def create_or_update_vector_search_index(
        index_name,
        credential):
    if credential is None:
        raise ValueError("credential cannot be None")

    try:
        # check if index already exists (it shouldn't if this is first time)
        if index_name not in pinecone.list_indexes():
            # if does not exist, create index
            pinecone.create_index(
                index_name,
                dimension=1536,
                metric='cosine'
            )

            # wait for index to be initialized
            while not pinecone.describe_index(index_name).status['ready']:
                time.sleep(1)

    except Exception as e:
        raise Exception(
            f"Failed to create vector index {index_name}. Error: {str(e)}")
    return True
     
def upsert_documents_to_index(
        index_name: str,
        docs: List[Document]
        ):
    
    index = pinecone.Index(index_name)
    for document in docs:
        finalDocChunk:dict = {}
        finalDocChunk["id"] = f"{uuid.uuid4()}"
        finalDocChunk['title'] = document.title
        finalDocChunk["filepath"] = document.filepath
        finalDocChunk["url"] = ""
        finalDocChunk["content"] = document.content
        finalDocChunk["contentvector"] = document.contentVector

        try:
            index.upsert([(finalDocChunk["id"],finalDocChunk["contentvector"], {"title":finalDocChunk['title'], "filepath":finalDocChunk['filepath'],"url":finalDocChunk['url'],"content":finalDocChunk['content']})])

            print(f"Upsert doc chunk {document.id} successfully")
        
        except Exception as e:
            print(f"Failed to upsert doc chunk {document.id}")
            continue

def validate_index(
        index_name):
    try:
        if not pinecone.describe_index(index_name).status['ready']:
            raise Exception(
                f"Failed to create vector index {index_name}. Error: {str(e)}")

    except Exception as e:
        raise Exception(
            f"Failed to create vector index {index_name}. Error: {str(e)}")  

def create_index(config, credential, form_recognizer_client=None, embedding_model_endpoint=None, use_layout=False, njobs=4):
    environment = config["environment"]
    api_key = config["api_key"]
    index_name = config["index_name"]
    language = config.get("language", None)

    if language and language not in SUPPORTED_LANGUAGE_CODES:
        raise Exception(f"ERROR: Ingestion does not support {language} documents. "
                        f"Please use one of {SUPPORTED_LANGUAGE_CODES}."
                        f"Language is set as two letter code for e.g. 'en' for English."
                        f"If you do not want to set a language just remove this prompt config or set as None")

    # check if pinecone database account exists
    try:
        check_if_pinecone_environment_exists(environment, api_key, credential)
        print(f"Using existing pinecone environment {environment}")
    except: 
        raise Exception(f"Pinecone environment {environment} doesn't exist.")

    # create or update vector search index with compatible schema
    try:
        create_or_update_vector_search_index(index_name, credential)
    except:
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
    upsert_documents_to_index(index_name, result.chunks)

    # check if index is ready/validate index
    print("Validating index...")
    validate_index(index_name)
    print("Index validation completed")

def valid_range(n):
    n = int(n)
    if n < 1 or n > 32:
        raise argparse.ArgumentTypeError("njobs must be an Integer between 1 and 32.")
    return n

if __name__ == "__main__": 
    parser = argparse.ArgumentParser()
    parser.add_argument("--pinecone-config", type=str, help="Path to config file containing settings for data preparation")
    parser.add_argument("--form-rec-resource", type=str, help="Name of your Form Recognizer resource to use for PDF cracking.")
    parser.add_argument("--form-rec-key", type=str, help="Key for your Form Recognizer resource to use for PDF cracking.")
    parser.add_argument("--form-rec-use-layout", default=False, action='store_true', help="Whether to use Layout model for PDF cracking, if False will use Read model.")
    parser.add_argument("--njobs", type=valid_range, default=4, help="Number of jobs to run (between 1 and 32). Default=4")
    parser.add_argument("--embedding-model-endpoint", type=str, help="Endpoint for the embedding model to use for vector search. Format: 'https://<AOAI resource name>.openai.azure.com/openai/deployments/<Ada deployment name>/embeddings?api-version=2023-03-15-preview'")
    parser.add_argument("--embedding-model-key", type=str, help="Key for the embedding model to use for vector search.")
    args = parser.parse_args()

    with open(args.pinecone_config) as f:
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