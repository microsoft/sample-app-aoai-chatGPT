import argparse
import dataclasses
import json
import os

from azure.identity import DefaultAzureCredential
from azure.core.credentials import AzureKeyCredential
from azure.keyvault.secrets import SecretClient
from azure.ai.formrecognizer import DocumentAnalysisClient

from data_utils import chunk_directory

def get_document_intelligence_client(config, secret_client):
    print("Setting up Document Intelligence client...")
    secret_name = config.get("document_intelligence_secret_name")

    if not secret_client or not secret_name:
        print("No keyvault url or secret name provided in config file. Document Intelligence client will not be set up.")
        return None

    endpoint = config.get("document_intelligence_endpoint")
    if not endpoint:
        print("No endpoint provided in config file. Document Intelligence client will not be set up.")
        return None
    
    try:
        document_intelligence_secret = secret_client.get_secret(secret_name)
        os.environ["FORM_RECOGNIZER_ENDPOINT"] = endpoint
        os.environ["FORM_RECOGNIZER_KEY"] = document_intelligence_secret.value

        document_intelligence_credential = AzureKeyCredential(document_intelligence_secret.value)

        document_intelligence_client = DocumentAnalysisClient(endpoint, document_intelligence_credential)
        print("Document Intelligence client set up.")
        return document_intelligence_client
    except Exception as e:
        print("Error setting up Document Intelligence client: {}".format(e))
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_data_path", type=str, required=True)
    parser.add_argument("--output_file_path", type=str, required=True)
    parser.add_argument("--config_file", type=str, required=True)

    args = parser.parse_args()

    with open(args.config_file) as f:
        config = json.load(f)

    credential = DefaultAzureCredential()

    if type(config) is not list:
        config = [config]
    
    for index_config in config:
        # Keyvault Secret Client
        keyvault_url = index_config.get("keyvault_url")
        if not keyvault_url:
            print("No keyvault url provided in config file. Secret client will not be set up.")
            secret_client = None
        else:
            secret_client = SecretClient(keyvault_url, credential)

        # Optional client for cracking documents
        document_intelligence_client = get_document_intelligence_client(index_config, secret_client)

        # Crack and chunk documents
        print("Cracking and chunking documents...")

        chunking_result = chunk_directory(
                            directory_path=args.input_data_path, 
                            num_tokens=index_config.get("chunk_size", 1024),
                            token_overlap=index_config.get("token_overlap", 128),
                            form_recognizer_client=document_intelligence_client,
                            use_layout=index_config.get("use_layout", False),
                            njobs=1)
        
        print(f"Processed {chunking_result.total_files} files")
        print(f"Unsupported formats: {chunking_result.num_unsupported_format_files} files")
        print(f"Files with errors: {chunking_result.num_files_with_errors} files")
        print(f"Found {len(chunking_result.chunks)} chunks")

        print("Writing chunking result to {}...".format(args.output_file_path))
        with open(args.output_file_path, "w") as f:
            for chunk in chunking_result.chunks:
                id = 0
                d = dataclasses.asdict(chunk)
                # add id to documents
                d.update({"id": str(id)})
                f.write(json.dumps(d) + "\n")
                id += 1
        print("Chunking result written to {}.".format(args.output_file_path))
