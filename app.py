import os
import uuid
import logging
import requests
import asyncio
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- API Client Imports ---
from openai import AzureOpenAI
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.storage.blob import (
    BlobServiceClient,
    BlobSasPermissions,
    generate_blob_sas
)
from dotenv import load_dotenv

# --- Configuration & Clients ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI()

# --- 1. Global Job Store (In-Memory) ---
# Stores the status of async tasks. In production, you might use Redis/Database,
# but for a single-instance App Service, this works perfectly.
JOBS = {} 

# --- 2. Environment Variables ---
try:
    AZURE_OPENAI_KEY = os.environ["AZURE_OPENAI_KEY"]
    AZURE_OPENAI_ENDPOINT = os.environ["AZURE_OPENAI_ENDPOINT"]
    DOC_INTEL_ENDPOINT = os.environ["DOC_INTEL_ENDPOINT"]
    DOC_INTEL_KEY = os.environ["DOC_INTEL_KEY"]
    AZURE_STORAGE_CONNECTION_STRING = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    AZURE_STORAGE_CONTAINER = os.environ["AZURE_STORAGE_CONTAINER"]
except KeyError as e:
    logger.error(f"Missing environment variable: {e}")
    # We don't raise SystemExit here to allow the app to start and log errors
    
DEFAULT_AZURE_DEPLOYMENT = "model-router"

# --- 3. Prompts ---
TASK_PROMPT_MAP = {
    "general_drafting": "You are Joogni, an expert writing assistant. Your task is to help the user draft or polish any form of text. Adapt your tone based on their request. Specializing in {jurisdiction} Family Law.",
    "legal_research": "You are Joogni, a legal research assistant. Provide concise, accurate answers. When possible, cite relevant {jurisdiction} statutes or case law.",
    "build_chronology": "You are Joogni, a case analyst. Build a detailed, reverse-chronological case chronology from the user's prompt and documents.",
    "analyze_document": "You are Joogni, a legal analyst. Analyze the attached document(s). Identify document type, key parties, factual points, and legal claims.",
    "draft_discovery_responses": "You are Joogni, a discovery expert. Draft discovery responses for {jurisdiction} law. Suggest boilerplate objections and format templates.",
    "draft_motion": "You are Joogni, a {jurisdiction} civil litigation specialist. Draft a formal motion including Notice, Points and Authorities, and Declaration.",
}
DEFAULT_PROMPT = "You are Joogni, an expert legal copilot specializing in {jurisdiction} Family Law."

# --- 4. Initialize Clients ---
azure_openai_client = AzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version="2024-02-01"
)

doc_intel_client = DocumentIntelligenceClient(
    endpoint=DOC_INTEL_ENDPOINT,
    credential=AzureKeyCredential(DOC_INTEL_KEY)
)

blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(AZURE_STORAGE_CONTAINER)

# --- 5. Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 6. Helper Functions ---
def extract_document_content(file_bytes: bytes, content_type: str) -> str:
    try:
        # FIX: Using the correct keyword argument 'body' for the new SDK
        poller = doc_intel_client.begin_analyze_document(
            "prebuilt-layout",
            body=file_bytes,
            content_type=content_type
        )
        result = poller.result()
        return result.content if result.content else "(Empty document)"
    except Exception as e:
        logger.error(f"Doc Intel error: {e}")
        return f"Error reading document: {e}"

def get_graph_headers(request: Request):
    """Extracts the Easy Auth token to call Microsoft Graph."""
    # Azure App Service injects this header when a user is logged in
    token = request.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN")
    if not token:
        # Fallback for local debugging if you have a manual token
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="No Authentication Token found.")
    
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# --- 7. Async Task Logic ---
async def run_copilot_task(job_id: str, data: dict):
    """
    The heavy lifting function running in the background.
    """
    try:
        JOBS[job_id]["status"] = "Processing"
        
        # Extract Data
        jurisdiction = data.get("jurisdiction", "California")
        task = data.get("task", "general_drafting")
        user_messages = data.get("messages", [])
        blobs = data.get("blobs", []) # Expects list of {blob_name, original_filename}

        # 1. Process Files (Download & Analyze)
        file_context = ""
        for blob_info in blobs:
            try:
                b_name = blob_info.get("blob_name")
                f_name = blob_info.get("original_filename")
                
                if b_name:
                    logger.info(f"Processing blob: {b_name}")
                    blob_client = container_client.get_blob_client(b_name)
                    download_stream = blob_client.download_blob()
                    file_bytes = download_stream.readall()
                    props = blob_client.get_blob_properties()
                    c_type = props.content_settings.content_type
                    
                    extracted_text = extract_document_content(file_bytes, c_type)
                    file_context += f"\n--- DOCUMENT: {f_name} ---\n{extracted_text}\n-----------------\n"
            except Exception as e:
                logger.error(f"File processing error: {e}")
                file_context += f"\n(Error reading {f_name}: {e})\n"

        # 2. Prepare Prompt
        if file_context and user_messages:
             # Append file context to the last user message
            user_messages[-1]["content"] = f"{file_context}\n\nUser Request: {user_messages[-1]['content']}"

        system_prompt_template = TASK_PROMPT_MAP.get(task, DEFAULT_PROMPT)
        system_prompt = system_prompt_template.format(jurisdiction=jurisdiction)
        
        messages_to_send = [{"role": "system", "content": system_prompt}] + user_messages

        # 3. Call OpenAI
        completion = azure_openai_client.chat.completions.create(
            model=DEFAULT_AZURE_DEPLOYMENT,
            messages=messages_to_send
        )
        reply = completion.choices[0].message.content

        # 4. Update Job
        JOBS[job_id]["status"] = "Complete"
        JOBS[job_id]["result"] = reply
        logger.info(f"Job {job_id} completed successfully.")

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        JOBS[job_id]["status"] = "Failed"
        JOBS[job_id]["result"] = str(e)

# --- 8. API Routes ---

@app.get("/")
async def root():
    return {"message": "Joogni AI Backend is Online"}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# --- File Upload SAS ---
class SasRequest(BaseModel):
    filename: str

@app.post("/api/get-upload-url")
async def get_upload_url(req: SasRequest):
    try:
        blob_name = f"{uuid.uuid4()}-{req.filename}"
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=AZURE_STORAGE_CONTAINER,
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(create=True, write=True),
            expiry=datetime.now(timezone.utc) + timedelta(minutes=15)
        )
        url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{AZURE_STORAGE_CONTAINER}/{blob_name}?{sas_token}"
        return {"upload_url": url, "blob_name": blob_name}
    except Exception as e:
        logger.error(f"SAS Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- Main Copilot Entry Point ---
@app.post("/api/copilot")
async def start_copilot_job(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        job_id = str(uuid.uuid4())
        
        # Initialize Job
        JOBS[job_id] = {"status": "Pending", "result": None}
        
        # Start Background Task
        background_tasks.add_task(run_copilot_task, job_id, data)
        
        logger.info(f"Started Job {job_id}")
        return {"job_id": job_id}
    except Exception as e:
        logger.error(f"Start Job Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- Status Polling ---
@app.get("/api/check_status/{job_id}")
async def check_job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    
    return {
        "status": job["status"],
        "result": job["result"]
    }

# --- Graph API Proxies ---

@app.post("/api/search-outlook")
async def search_outlook(request: Request):
    """Searches User's Outlook via Graph API."""
    try:
        headers = get_graph_headers(request)
        payload = await request.json()
        query = payload.get("query", "")
        
        # Graph API Query
        graph_url = "https://graph.microsoft.com/v1.0/me/messages"
        params = {
            "$top": 10,
            "$select": "subject,receivedDateTime,from,hasAttachments,bodyPreview,id",
            "$filter": "hasAttachments eq true",
            "$orderby": "receivedDateTime desc"
        }
        if query:
            params["$search"] = f'"{query}"'

        # Explicitly tell Graph we want to use $search
        headers["ConsistencyLevel"] = "eventual"

        async with requests.Session() as s:
            resp = s.get(graph_url, headers=headers, params=params)
            if resp.status_code != 200:
                logger.error(f"Graph Error: {resp.text}")
                return JSONResponse(status_code=resp.status_code, content={"error": "Graph API Check Failed"})
            return resp.json()
            
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/search-outlook/{message_id}/attachments")
async def get_attachments(message_id: str, request: Request):
    """Gets attachments for a specific email."""
    try:
        headers = get_graph_headers(request)
        url = f"https://graph.microsoft.com/v1.0/me/messages/{message_id}/attachments"
        resp = requests.get(url, headers=headers)
        return JSONResponse(status_code=resp.status_code, content=resp.json())
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/download-graph-file")
async def download_graph_file(request: Request):
    """
    Downloads a file from Graph (via provided URL) and uploads it to Azure Blob.
    Returns the blob info so the chatbot can process it.
    """
    try:
        headers = get_graph_headers(request)
        payload = await request.json()
        download_url = payload.get("download_url")
        original_filename = payload.get("file_name", "unknown_file")

        if not download_url:
            raise HTTPException(status_code=400, detail="Missing download_url")

        # 1. Download from Graph
        resp = requests.get(download_url, headers=headers)
        if resp.status_code != 200:
             raise HTTPException(status_code=400, detail="Could not download file from Graph")
        
        file_bytes = resp.content

        # 2. Upload to Azure Blob
        blob_name = f"graph-{uuid.uuid4()}-{original_filename}"
        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(file_bytes, overwrite=True)

        return {
            "blob_name": blob_name,
            "original_filename": original_filename
        }
    except Exception as e:
        logger.error(f"Graph Download Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
