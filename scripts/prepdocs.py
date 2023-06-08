import argparse
import dataclasses

from tqdm import tqdm
from azure.identity import AzureDeveloperCliCredential
from azure.core.credentials import AzureKeyCredential
from azure.storage.blob import BlobServiceClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchableField,
    SemanticField,
    SemanticSettings,
    SemanticConfiguration,
    SearchIndex,
    PrioritizedFields
)
from azure.search.documents import SearchClient
from azure.ai.formrecognizer import DocumentAnalysisClient


from data_utils import chunk_directory



def create_search_index(index_name, index_client):
    print(f"Ensuring search index {index_name} exists")
    if index_name not in index_client.list_index_names():
        index = SearchIndex(
            name=index_name,
            fields=[
                SearchableField(name="id", type="Edm.String", key=True),
                SearchableField(name="content", type="Edm.String", analyzer_name="en.lucene"),
                SearchableField(name="title", type="Edm.String", analyzer_name="en.lucene"),
                SearchableField(name="filepath", type="Edm.String"),
                SearchableField(name="url", type="Edm.String"),
                SearchableField(name="metadata", type="Edm.String")
            ],
            semantic_settings=SemanticSettings(
                configurations=[SemanticConfiguration(
                    name='default',
                    prioritized_fields=PrioritizedFields(
                        title_field=SemanticField(field_name='title'),
                        prioritized_content_fields=[SemanticField(field_name='content')]))])
        )
        print(f"Creating {index_name} search index")
        index_client.create_index(index)
    else:
        print(f"Search index {index_name} already exists")

def upload_documents_to_index(docs, search_client, upload_batch_size = 50):
    to_upload_dicts = []

    id = 0
    for document in docs:
        d = dataclasses.asdict(document)
        # add id to documents
        d.update({"@search.action": "upload", "id": str(id)})
        to_upload_dicts.append(d)
        id += 1
    

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


def create_and_populate_index(index_name, index_client, search_client, form_recognizer_client):

    # create or update search index with compatible schema
    create_search_index(index_name, index_client)

    # chunk directory
    print("Chunking directory...")
    result = chunk_directory("./data", form_recognizer_client=form_recognizer_client, use_layout=True, ignore_errors=False)

    if len(result.chunks) == 0:
        raise Exception("No chunks found. Please check the data path and chunk size.")

    print(f"Processed {result.total_files} files")
    print(f"Unsupported formats: {result.num_unsupported_format_files} files")
    print(f"Files with errors: {result.num_files_with_errors} files")
    print(f"Found {len(result.chunks)} chunks")

    # upload documents to index
    print("Uploading documents to index...")
    upload_documents_to_index(result.chunks, search_client)

    # check if index is ready/validate index
    # print("Validating index...")
    # TODO: validate_index(index_name) - Port to Azure CLI
    # print("Index validation completed")


if __name__ == "__main__": 
    parser = argparse.ArgumentParser(
        description="Prepare documents by extracting content from PDFs, splitting content into sections, uploading to blob storage, and indexing in a search index.",
        epilog="Example: prepdocs.py '..\data\*' --storageaccount myaccount --container mycontainer --searchservice mysearch --index myindex -v"
        )
    parser.add_argument("files", help="Files to be processed")
    parser.add_argument("--storageaccount", help="Azure Blob Storage account name")
    parser.add_argument("--container", help="Azure Blob Storage container name")
    parser.add_argument("--storagekey", required=False, help="Optional. Use this Azure Blob Storage account key instead of the current user identity to login (use az login to set current user for Azure)")
    parser.add_argument("--tenantid", required=False, help="Optional. Use this to define the Azure directory where to authenticate)")
    parser.add_argument("--searchservice", help="Name of the Azure Cognitive Search service where content should be indexed (must exist already)")
    parser.add_argument("--index", help="Name of the Azure Cognitive Search index where content should be indexed (will be created if it doesn't exist)")
    parser.add_argument("--searchkey", required=False, help="Optional. Use this Azure Cognitive Search account key instead of the current user identity to login (use az login to set current user for Azure)")
    parser.add_argument("--formrecognizerservice", required=False, help="Optional. Name of the Azure Form Recognizer service which will be used to extract text, tables and layout from the documents (must exist already)")
    parser.add_argument("--formrecognizerkey", required=False, help="Optional. Use this Azure Form Recognizer account key instead of the current user identity to login (use az login to set current user for Azure)")
    args = parser.parse_args()

    # Use the current user identity to connect to Azure services unless a key is explicitly set for any of them
    azd_credential = AzureDeveloperCliCredential() if args.tenantid == None else AzureDeveloperCliCredential(tenant_id=args.tenantid, process_timeout=60)
    default_creds = azd_credential if args.searchkey == None or args.storagekey == None else None
    search_creds = default_creds if args.searchkey == None else AzureKeyCredential(args.searchkey)
    formrecognizer_creds = default_creds if args.formrecognizerkey == None else AzureKeyCredential(args.formrecognizerkey)

    print("Data preparation script started")
    print("Preparing data for index:", args.index)
    search_endpoint = f"https://{args.searchservice}.search.windows.net/" 
    index_client = SearchIndexClient(endpoint=search_endpoint, credential=search_creds)
    search_client = SearchClient(endpoint=search_endpoint, credential=search_creds, index_name=args.index)
    form_recognizer_client = DocumentAnalysisClient(
        endpoint=f"https://{args.formrecognizerservice}.cognitiveservices.azure.com/",
        credential=formrecognizer_creds)

    create_and_populate_index(args.index, index_client, search_client, form_recognizer_client)
    print("Data preparation for index", args.index, "completed")