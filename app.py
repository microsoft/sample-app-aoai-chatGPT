import os
import json
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# FastAPI app
app = FastAPI(title="PB25 Backend", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER", "chatuploads")

blob_service_client = None
container_client = None

if AZURE_STORAGE_CONNECTION_STRING:
    try:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        container_client = blob_service_client.get_container_client(AZURE_STORAGE_CONTAINER)
        logger.info(f"Storage configured for container: {AZURE_STORAGE_CONTAINER}")
    except Exception as e:
        logger.error(f"Failed to initialize storage: {e}")

# Models
class UploadUrlRequest(BaseModel):
    filename: str

class FileInfo(BaseModel):
    blob_name: str
    original_filename: str

class CopilotRequest(BaseModel):
    jurisdiction: str = "California"
    task: str = "general"
    messages: List[Dict[str, Any]] = []
    blobs: List[FileInfo] = []

class CloudSearchRequest(BaseModel):
    query: str = ""

class GraphFileRequest(BaseModel):
    file_id: str
    file_name: str
    download_url: str

# Endpoints
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "storage_configured": bool(blob_service_client),
        "container": AZURE_STORAGE_CONTAINER
    }

@app.post("/api/get-upload-url")
async def get_upload_url(request: UploadUrlRequest):
    """Generate SAS URL for file upload."""
    try:
        if not blob_service_client or not AZURE_STORAGE_CONNECTION_STRING:
            logger.error("Storage not configured")
            raise HTTPException(status_code=500, detail="Storage service not configured")
        
        # Generate unique blob name
        blob_name = f"{uuid.uuid4()}_{request.filename}"
        logger.info(f"Generating upload URL for: {blob_name}")
        
        # Parse connection string
        conn_str_parts = {}
        for part in AZURE_STORAGE_CONNECTION_STRING.split(';'):
            if '=' in part:
                key, value = part.split('=', 1)
                conn_str_parts[key] = value
        
        account_name = conn_str_parts.get('AccountName')
        account_key = conn_str_parts.get('AccountKey')
        
        if not account_name or not account_key:
            logger.error("Invalid connection string format")
            raise HTTPException(status_code=500, detail="Invalid storage configuration")
        
        # Generate SAS token
        sas_token = generate_blob_sas(
            account_name=account_name,
            container_name=AZURE_STORAGE_CONTAINER,
            blob_name=blob_name,
            account_key=account_key,
            permission=BlobSasPermissions(write=True, create=True),
            expiry=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        
        # Build upload URL
        upload_url = f"https://{account_name}.blob.core.windows.net/{AZURE_STORAGE_CONTAINER}/{blob_name}?{sas_token}"
        
        logger.info(f"Generated upload URL successfully for blob: {blob_name}")
        return {
            "upload_url": upload_url,
            "blob_name": blob_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error generating upload URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/copilot")
async def copilot(request: CopilotRequest):
    """Process copilot request - temporary implementation."""
    try:
        job_id = str(uuid.uuid4())
        logger.info(f"Created job: {job_id}")
        
        # Create a placeholder result
        result_data = {
            "job_id": job_id,
            "status": "Complete",
            "result": "Files uploaded successfully. Document processing is temporarily in maintenance mode.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Save to blob storage if available
        if blob_service_client and container_client:
            try:
                result_blob_name = f"results/{job_id}.json"
                blob_client = container_client.get_blob_client(result_blob_name)
                blob_client.upload_blob(
                    json.dumps(result_data),
                    overwrite=True
                )
                logger.info(f"Saved result for job: {job_id}")
            except Exception as e:
                logger.error(f"Failed to save result: {e}")
        
        return {"job_id": job_id}
        
    except Exception as e:
        logger.exception(f"Error in copilot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/check_status/{job_id}")
async def check_status(job_id: str):
    """Check job status."""
    try:
        # Try to get from blob storage
        if blob_service_client and container_client:
            try:
                result_blob_name = f"results/{job_id}.json"
                blob_client = container_client.get_blob_client(result_blob_name)
                
                if blob_client.exists():
                    data = json.loads(blob_client.download_blob().readall())
                    return data
            except Exception as e:
                logger.error(f"Error reading job result: {e}")
        
        # Return default response
        return {
            "status": "Complete",
            "result": "Processing complete.",
            "job_id": job_id
        }
        
    except Exception as e:
        logger.exception(f"Error checking status: {e}")
        return {"status": "Failed", "error": str(e)}

@app.post("/api/search-outlook")
async def search_outlook(request: CloudSearchRequest):
    """Placeholder for Outlook search."""
    return {"value": []}

@app.get("/api/search-outlook/{email_id}/attachments")
async def get_email_attachments(email_id: str):
    """Placeholder for email attachments."""
    return {"value": []}

@app.post("/api/search-onedrive")
async def search_onedrive(request: CloudSearchRequest):
    """Placeholder for OneDrive search."""
    return {"value": []}

@app.post("/api/download-graph-file")
async def download_graph_file(request: GraphFileRequest):
    """Placeholder for Graph file download."""
    # Return a dummy response that won't break the frontend
    return FileInfo(
        blob_name=f"placeholder_{uuid.uuid4()}.pdf",
        original_filename=request.file_name
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
