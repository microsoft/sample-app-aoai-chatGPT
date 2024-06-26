from azure.storage.blob import BlobServiceClient, ContentSettings, BlobSasPermissions, generate_blob_sas
# from dotenv import load_dotenv
import datetime
import os
import json

# load_dotenv()
connection_string = os.environ.get("BLOB_CONNECTION_STRING_WEBPAGE_LEY73")

def generate_sas_url_for_blob_with_inline(connection_string, container_name, blob_name):
    # Create a BlobServiceClient using the connection string
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)

    # Extract account name and key
    account_name = blob_service_client.account_name
    account_key = blob_service_client.credential.account_key  # Retrieve the key correctly

    # Define the SAS token expiration and start time
    sas_token_start = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    sas_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # Valid for 24 hour

    # Set permissions for the SAS token
    sas_permissions = BlobSasPermissions(read=True)

    # Generate SAS token with adjusted timing and content disposition
    sas_token = generate_blob_sas(account_name=account_name,
                                  container_name=container_name,
                                  blob_name=blob_name,
                                  account_key=account_key,
                                  permission=sas_permissions,
                                  start=sas_token_start,
                                  expiry=sas_token_expiry,
                                  content_disposition="inline; filename=\"{}\"".format(blob_name.replace(" ", "%20")))

    # Build the full URL with the SAS token
    blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"
    return blob_url

def list_blob_filenames_with_urls(connection_string, container_name):
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)
    blob_list = container_client.list_blobs()
    print(blob_list)

    # Generate URLs with inline viewing for each blob
    filenames_with_urls = {blob.name: generate_sas_url_for_blob_with_inline(connection_string, container_name, blob.name) for blob in blob_list}

    # Convert to JSON format
    return json.dumps(filenames_with_urls, indent=4)

def list_blobs_in_container(connection_string, container_name):
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)
    blob_names = [blob.name for blob in container_client.list_blobs()]
    return blob_names

def list_blob_filenames_CDN_urls(connection_string, container_name):
    # base_url = "https://strag062kuf.blob.core.windows.net" #NOTE: base URL for storage account container
    base_url = "https://leyes.azureedge.net/" #NOTE: URL to preview inline the PDF Document, configured from Azure Storage Account Content Delivery Network(CDN)
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)
    blob_list = container_client.list_blobs()
    filenames_with_urls = {blob.name: f"{base_url}/{container_name}/{blob.name}" for blob in blob_list}
    return filenames_with_urls

#NOTE: FUNCTION TO CHANGE THE CONTENT_TYPE PROPERTIE OF EACH BLOB
#NOTE: CHANGE FROM application/octet-stream to application/pdf

def update_blob_content_type(connection_string, container_name, blob_name, new_content_type):
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)
    blob_client = container_client.get_blob_client(blob_name)
    content_settings = ContentSettings(content_type=new_content_type)
   
    blob_client.set_http_headers(content_settings=content_settings)
    print(f"Content-Type for {blob_name} updated to {new_content_type}")

def generate_sas_url_for_blob(connection_string, container_name, blob_name):
    # Create a BlobServiceClient using the connection string
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)

    # Get the account name for the SAS token
    account_name = blob_service_client.account_name

    # Define the SAS token expiration time (1 day as an example)
    sas_token_expiration = datetime.datetime.utcnow() + datetime.timedelta(days=1)

    # Set permissions for the SAS token
    sas_permissions = BlobSasPermissions(read=True)

    # Generate SAS token
    sas_token = generate_blob_sas(account_name=account_name, 
                                  container_name=container_name, 
                                  blob_name=blob_name, 
                                  account_key=blob_service_client.credential.account_key,
                                  permission=sas_permissions,
                                  expiry=sas_token_expiration)

    # Build the full URL with the SAS token
    blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"
    
    return blob_url

def generate_sas_url_for_blob_with_inline(connection_string, container_name, blob_name):
    # Create a BlobServiceClient using the connection string
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)

    # Extract account name and key for clarity
    account_name = blob_service_client.account_name
    account_key = blob_service_client.credential.account_key  # Ensure this retrieves the key correctly

    # Adjust SAS token valid time to account for potential clock skew
    sas_token_start = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    sas_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # 1 hour validity

    # Set permissions for the SAS token
    sas_permissions = BlobSasPermissions(read=True)

    # Generate SAS token with adjusted timing and content disposition
    sas_token = generate_blob_sas(account_name=account_name,
                                  container_name=container_name,
                                  blob_name=blob_name,
                                  account_key=account_key,
                                  permission=sas_permissions,
                                  start=sas_token_start,
                                  expiry=sas_token_expiry,
                                  content_disposition="inline; filename=\"{}\"".format(blob_name))

    # Build the full URL with the SAS token
    blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"
    
    return blob_url


container_name = "webpage-ley73"
x = list_blob_filenames_CDN_urls(connection_string, container_name)
print(x)


# sas_url = generate_sas_url_for_blob(connection_string, container_name, blob_name)
# print("SAS URL:", sas_url)

# container_name = "webpage-ley73"
# filenames_with_urls = list_blob_filenames_with_urls(connection_string, container_name)
# filenames_json = json.dumps(filenames_with_urls)

# print(filenames_json)
# print(f"Number of files in container {container_name}: {len(filenames_with_urls)}")


#NOTE: Execution to change content type
# blob_names = list_blobs_in_container(connection_string, container_name)

# for blob_name in blob_names:
#     update_blob_content_type(connection_string, container_name, blob_name, "application/pdf")

# Usage
# container_name = "webpage-ley73"
# json_blob_urls = list_blob_filenames_with_urls(connection_string, container_name)
# print(json_blob_urls)
