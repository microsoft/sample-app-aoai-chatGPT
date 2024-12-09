import argparse
from asyncio import sleep
import dataclasses
import json
import os

from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

from data_preparation import create_or_update_search_index, upload_documents_to_index

RETRY_COUNT = 5

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_data_path", type=str, required=True)
    parser.add_argument("--config_file", type=str, required=True)

    args = parser.parse_args()

    with open(args.config_file) as f:
        config = json.load(f)

    credential = DefaultAzureCredential()

    if type(config) is not list:
        config = [config]
    
    for index_config in config:
        # Keyvault Secret Client
        print("Connecting to keyvault...")
        keyvault_url = index_config.get("keyvault_url")
        if not keyvault_url:
            print("No keyvault url provided in config file. Secret client will not be set up.")
            secret_client = None
        else:
            secret_client = SecretClient(keyvault_url, credential)

        # Get Search Key
        search_key_secret_name = index_config.get("search_key_secret_name")
        if not search_key_secret_name:
            raise ValueError("No search key secret name provided in config file. Index will not be created.")
        else:
            search_key_secret = secret_client.get_secret(search_key_secret_name)
            search_key = search_key_secret.value

        search_service_name = index_config.get("search_service_name")
        if not search_service_name:
            raise ValueError("No search service name provided in config file. Index will not be created.")

        # Create Index
        print("Creating index...")
        index_name = index_config.get("index_name", "default-index")
        create_or_update_search_index(
            service_name=search_service_name,
            index_name=index_name,
            vector_config_name="default" if "embedding_endpoint" in index_config else None,
            admin_key=search_key
        )
        print(f"Index {index_name} created.")

        # Upload Documents
        print("Uploading documents...")
        with open(args.input_data_path) as input_file:
            documents = [json.loads(line) for line in input_file]
        
        upload_documents_to_index(search_service_name, "", "", index_name, documents, admin_key=search_key)
        print("Done.")

