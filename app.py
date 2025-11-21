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
class SasRequest(BaseModel):
    filename: str

# --- 2. GLOBAL STATE ---
JOBS = {}

# --- 3. ROUTES ---

@app.get("/")
async def root():
    return {"status": "Online", "message": "Server is running (Debug Mode)"}

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

@app.get("/api/check_status/{job_id}")
async def check_job_status(job_id: str):
    """
    Checks the status of a background job.
    """
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    
    return {
        "status": job["status"],
        "result": job["result"]
    }

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

# --- 4. BACKGROUND TASK (DEBUG MODE) ---

async def lazy_copilot_task(job_id: str, data: dict):
    JOBS[job_id] = {"status": "Processing", "result": ""}
    debug_log = [] # Collecting logs to show user
    
    try:
        # 1. LAZY IMPORTS
        try:
            from openai import AzureOpenAI
            from azure.core.credentials import AzureKeyCredential
            from azure.ai.documentintelligence import DocumentIntelligenceClient
            from azure.storage.blob import BlobServiceClient
            debug_log.append("Libraries Loaded")
        except ImportError as e:
            raise ImportError(f"Library Installation Failed: {e}")

        # 2. EXTRACT FILES
        blobs = data.get("blobs", [])
        debug_log.append(f"Frontend sent {len(blobs)} blobs")
        
        file_context = ""
        
        # Initialize Clients
        storage_conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        storage_cont = os.getenv("AZURE_STORAGE_CONTAINER")
        doc_endpoint = os.getenv("DOC_INTEL_ENDPOINT")
        doc_key = os.getenv("DOC_INTEL_KEY")

        if storage_conn and storage_cont:
            blob_service = BlobServiceClient.from_connection_string(storage_conn)
            container_client = blob_service.get_container_client(storage_cont)
            
            if doc_endpoint and doc_key:
                doc_client = DocumentIntelligenceClient(endpoint=doc_endpoint, credential=AzureKeyCredential(doc_key))
                
                for blob_info in blobs:
                    b_name = blob_info.get("blob_name")
                    f_name = blob_info.get("original_filename")
                    try:
                        # Download
                        debug_log.append(f"Downloading {f_name}")
                        blob_client = container_client.get_blob_client(b_name)
                        file_data = blob_client.download_blob().readall()
                        
                        # Analyze
                        debug_log.append(f"Analyzing {f_name} ({len(file_data)} bytes)")
                        poller = doc_client.begin_analyze_document(
                            "prebuilt-layout", 
                            body=file_data 
                        )
                        result = poller.result()
                        text = result.content
                        
                        if not text:
                            text = "(No text found in document)"
                            
                        file_context += f"\n--- FILE: {f_name} ---\n{text}\n"
                        debug_log.append(f"Success: {f_name}")
                    except Exception as e:
                        debug_log.append(f"Failed {f_name}: {str(e)}")
            else:
                debug_log.append("DocIntel Keys Missing")
        else:
            debug_log.append("Storage Keys Missing")

        # 3. RUN AI
        key = os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        
        if not key:
            raise ValueError("Azure OpenAI Key Missing")

        client = AzureOpenAI(api_key=key, azure_endpoint=endpoint, api_version="2024-02-01")
        
        task = data.get("task", "general")
        user_msg = data.get("messages", [])[-1].get("content", "")
        
        # Inject the extracted text and the DEBUG LOG into the prompt
        final_prompt = f"{file_context}\n\nUser Query: {user_msg}\n\n(SYSTEM DEBUG LOG: {'; '.join(debug_log)})"
        
        completion = client.chat.completions.create(
            model="model-router",
            messages=[
                {"role": "system", "content": "You are a helpful AI. If there is a SYSTEM DEBUG LOG at the end, summarize it for the user so they know if files were read successfully."},
                {"role": "user", "content": final_prompt}
            ]
        )
        
        JOBS[job_id]["status"] = "Complete"
        JOBS[job_id]["result"] = completion.choices[0].message.content

    except Exception as e:
        logger.error(f"Job Failed: {e}")
        JOBS[job_id]["status"] = "Failed"
        JOBS[job_id]["result"] = f"CRITICAL ERROR: {str(e)} | Debug Log: {'; '.join(debug_log)}"
