import os
import uuid
import logging
import sys
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. DEFINITIONS (MUST BE AT TOP) ---
# We define this HERE so it exists before any route tries to use it.
class SasRequest(BaseModel):
    filename: str

# --- 2. ROUTES ---

@app.get("/")
async def root():
    return {"status": "Online", "message": "Server is running (Lazy Mode)"}

@app.post("/api/copilot")
async def start_copilot_job(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        job_id = str(uuid.uuid4())
        
        # Wrapper for background task
        background_tasks.add_task(lazy_copilot_task, job_id, data)
        
        return {"job_id": job_id}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/get-upload-url")
async def get_upload_url(req: SasRequest):
    """
    Generates a SAS URL for uploading files.
    """
    try:
        # Lazy Import Storage Client
        from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas
        
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container = os.getenv("AZURE_STORAGE_CONTAINER")
        
        if not connect_str or not container:
            return JSONResponse(status_code=500, content={"error": "Storage Config Missing on Server"})

        blob_service_client = BlobServiceClient.from_connection_string(connect_str)
        
        blob_name = f"{uuid.uuid4()}-{req.filename}"
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=container,
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(create=True, write=True),
            expiry=datetime.now(timezone.utc) + timedelta(minutes=15)
        )
        url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container}/{blob_name}?{sas_token}"
        return {"upload_url": url, "blob_name": blob_name}
    
    except ImportError:
        return JSONResponse(status_code=500, content={"error": "Azure Storage Library not installed."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- 3. BACKGROUND TASK LOGIC ---
JOBS = {}

async def lazy_copilot_task(job_id: str, data: dict):
    JOBS[job_id] = {"status": "Processing", "result": ""}
    try:
        # LAZY IMPORTS - Prevents startup crash if libraries fail
        try:
            from openai import AzureOpenAI
            from azure.core.credentials import AzureKeyCredential
            from azure.ai.documentintelligence import DocumentIntelligenceClient
            from azure.storage.blob import BlobServiceClient
        except ImportError as e:
            raise ImportError(f"Library Installation Failed: {e}")

        # CHECK KEYS
        key = os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        
        if not key or not endpoint:
            raise ValueError(f"Missing Azure OpenAI Key/Endpoint. Keys found: {list(os.environ.keys())}")

        # RUN AI
        client = AzureOpenAI(api_key=key, azure_endpoint=endpoint, api_version="2024-02-01")
        
        task = data.get("task", "general")
        user_msg = data.get("messages", [])[-1].get("content", "")
        
        completion = client.chat.completions.create(
            model="model-router",
            messages=[
                {"role": "system", "content": f"You are a helpful AI. Task: {task}"},
                {"role": "user", "content": user_msg}
            ]
        )
        
        JOBS[job_id]["status"] = "Complete"
        JOBS[job_id]["result"] = completion.choices[0].message.content

    except Exception as e:
        logger.error(f"Job Failed: {e}")
        JOBS[job_id]["status"] = "Failed"
        JOBS[job_id]["result"] = f"CRITICAL ERROR: {str(e)}"

@app.get("/api/check_status/{job_id}")
async def check_job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return {"status": job["status"], "result": job["result"]}
