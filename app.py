import os
import json
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER", "chatuploads")

blob_service_client = None
if AZURE_STORAGE_CONNECTION_STRING:
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)

class UploadUrlRequest(BaseModel):
    filename: str

@app.get("/health")
async def health():
    return {"status": "ok", "storage": bool(blob_service_client)}

@app.post("/api/get-upload-url")
async def get_upload_url(request: UploadUrlRequest):
    if not blob_service_client:
        raise HTTPException(500, "Storage not configured")
    
    blob_name = f"{uuid.uuid4()}_{request.filename}"
    conn_str_parts = dict(p.split('=', 1) for p in AZURE_STORAGE_CONNECTION_STRING.split(';') if '=' in p)
    
    sas_token = generate_blob_sas(
        account_name=conn_str_parts['AccountName'],
        container_name=AZURE_STORAGE_CONTAINER,
        blob_name=blob_name,
        account_key=conn_str_parts['AccountKey'],
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    
    upload_url = f"https://{conn_str_parts['AccountName']}.blob.core.windows.net/{AZURE_STORAGE_CONTAINER}/{blob_name}?{sas_token}"
    return {"upload_url": upload_url, "blob_name": blob_name}

@app.post("/api/copilot")
async def copilot(request: dict):
    job_id = str(uuid.uuid4())
    return {"job_id": job_id}

@app.get("/api/check_status/{job_id}")
async def check_status(job_id: str):
    return {"status": "Complete", "result": "File uploaded successfully. AI processing temporarily offline."}
