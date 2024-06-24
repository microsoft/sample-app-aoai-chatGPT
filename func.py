from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv
import os

load_dotenv()
connection_string = os.getenv("BLOB_CONNECTION_STRING_WEBPAGE_LEY73")

def list_blob_filenames(connection_string, container_name):
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)
    blob_list = container_client.list_blobs()
    filenames = [blob.name for blob in blob_list]
    
    return filenames


container_name = "webpage-ley73"

filenames = list_blob_filenames(connection_string, container_name)
for i in filenames:
    print(i)
print(f"Number of files in contrainer {container_name}: {len(filenames)}")
