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
from dotenv import load_dotenv

# --- Safe Import Strategy ---
# We try to import the heavy SDKs. If they fail, we don't crash the app;
# we just mark them as unavailable so we can report it to the user.
LIBS_OK = True
IMPORT_ERROR = ""

try:
    from openai import AzureOpenAI
    from azure.core.credentials import AzureKeyCredential
    from azure.ai.documentintelligence import DocumentIntelligenceClient
    from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas
except ImportError as e:
    LIBS_OK = False
    IMPORT_ERROR = str(e)

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

# --- 1. Safe Client Initialization ---
# instead of crashing on missing keys, we log them and handle them later.

def get_env_or_none(key):
    val = os.getenv(key)
    if not val:
        logger.warning(f"⚠️ Missing Environment Variable: {key}")
    return val

AZURE_OPENAI_KEY = get_env_or_none("AZURE_OPENAI_KEY")
AZURE_OPENAI_ENDPOINT = get_env_or_none("AZURE_OPENAI_ENDPOINT")
DOC_INTEL_ENDPOINT = get_env_or_none("DOC_INTEL_ENDPOINT")
DOC_INTEL_KEY = get_env_or_none("DOC_INTEL_KEY")
AZURE_STORAGE_CONNECTION_STRING = get_env_or_none("AZURE_STORAGE_CONNECTION_STRING")
AZURE_STORAGE_CONTAINER = get_env_or_none("AZURE_STORAGE_CONTAINER")

# Initialize clients only if keys exist
azure_openai_client = None
doc_intel_client = None
blob_service_client = None
container_client = None

if LIBS_OK:
    try:
        if AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT:
            azure_openai_client = AzureOpenAI(
                api_key=AZURE_OPENAI_KEY,
                azure_endpoint=AZURE_OPENAI_ENDPOINT,
                api_version="2024-02-01"
            )
        
        if DOC_INTEL_KEY and DOC_INTEL_ENDPOINT:
            doc_intel_client = DocumentIntelligenceClient(
                endpoint=DOC_INTEL_ENDPOINT,
                credential=AzureKeyCredential(DOC_INTEL_KEY)
            )

        if AZURE_STORAGE_CONNECTION_STRING:
            blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
            if AZURE_STORAGE_CONTAINER:
                container_client = blob_service_client.get_container_client(AZURE_STORAGE_CONTAINER)
    except Exception as e:
        logger.error(f"Client Initialization Error: {e}")

# --- Prompts ---
TASK_PROMPT_MAP = {
    "general_drafting": "You are Joogni, an expert writing assistant. Your task is to help the user draft or polish any form of text. Adapt your tone based on their request. Specializing in {jurisdiction} Family Law.",
    "legal_research": "You are Joogni, a legal research assistant. Provide concise, accurate answers. When possible, cite relevant {jurisdiction} statutes or case law.",
    "build_chronology": "You are Joogni, a case analyst. Build a detailed, reverse-chronological case chronology from the user's prompt and documents.",
    "analyze_document": "You are Joogni, a legal analyst. Analyze the attached document(s). Identify document type, key parties, factual points, and legal claims.",
}
DEFAULT_PROMPT = "You are Joogni, an expert legal copilot specializing in {jurisdiction} Family Law."
JOBS = {}

# --- Helper Functions ---
def extract_document_content(file_bytes: bytes, content_type: str) -> str:
    if not doc_intel_client:
        return "(Document Intelligence not configured)"
    try:
        poller = doc_intel_client.begin_analyze_document(
            "prebuilt-layout",
            body=file_bytes,
            content_type=content_type
        )
        result = poller.result()
        return result.content if result.content else "(Empty document)"
    except Exception as e:
        return f"Error reading document: {e}"

async def run_copilot_task(job_id: str, data: dict):
    try:
        JOBS[job_id]["status"] = "Processing"
        
        if not azure_openai_client:
             raise ValueError("Azure OpenAI Client is not initialized. Check server logs for missing keys.")

        # Extract Data
        jurisdiction = data.get("jurisdiction", "California")
        task = data.get("task", "general_drafting")
        user_messages = data.get("messages", [])
        blobs = data.get("blobs", [])

        # 1. Process Files
        file_context = ""
        if container_client:
            for blob_info in blobs:
                try:
                    b_name = blob_info.get("blob_name")
                    f_name = blob_info.get("original_filename")
                    if b_name:
                        blob_client = container_client.get_blob_client(b_name)
                        download_stream = blob_client.download_blob()
                        file_bytes = download_stream.readall()
                        props = blob_client.get_blob_properties()
                        c_type = props.content_settings.content_type
                        extracted_text = extract_document_content(file_bytes, c_type)
                        file_context += f"\n--- DOCUMENT: {f_name} ---\n{extracted_text}\n-----------------\n"
                except Exception as e:
                    file_context += f"\n(Error reading {f_name}: {e})\n"

        # 2. Prepare Prompt
        if file_context and user_messages:
            user_messages[-1]["content"] = f"{file_context}\n\nUser Request: {user_messages[-1]['content']}"

        system_prompt = TASK_PROMPT_MAP.get(task, DEFAULT_PROMPT).format(jurisdiction=jurisdiction)
        messages_to_send = [{"role": "system", "content": system_prompt}] + user_messages

        # 3. Call OpenAI
        completion = azure_openai_client.chat.completions.create(
            model="model-router",
            messages=messages_to_send
        )
        JOBS[job_id]["status"] = "Complete"
        JOBS[job_id]["result"] = completion.choices[0].message.content

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        JOBS[job_id]["status"] = "Failed"
        JOBS[job_id]["result"] = f"System Error: {str(e)}"

# --- Routes ---

@app.get("/")
async def root():
    # This route now performs a self-diagnosis
    status = {
        "status": "Online",
        "libs_loaded": LIBS_OK,
        "openai_client": bool(azure_openai_client),
        "doc_intel_client": bool(doc_intel_client),
        "storage_client": bool(blob_service_client)
    }
    if not LIBS_OK:
        status["error"] = f"Library Import Failed: {IMPORT_ERROR}"
    return status

@app.post("/api/copilot")
async def start_copilot_job(request: Request, background_tasks: BackgroundTasks):
    # FAIL FAST: If keys are missing, tell the frontend immediately
    if not LIBS_OK:
         return JSONResponse(status_code=500, content={"error": f"Server Startup Failed. Missing Libraries: {IMPORT_ERROR}"})
    if not azure_openai_client:
        return JSONResponse(status_code=500, content={"error": "Azure OpenAI Key or Endpoint is missing on the server."})

    try:
        data = await request.json()
        job_id = str(uuid.uuid4())
        JOBS[job_id] = {"status": "Pending", "result": None}
        background_tasks.add_task(run_copilot_task, job_id, data)
        return {"job_id": job_id}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/check_status/{job_id}")
async def check_job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return {"status": job["status"], "result": job["result"]}

@app.post("/api/get-upload-url")
async def get_upload_url(req: SasRequest):
    if not blob_service_client:
         return JSONResponse(status_code=500, content={"error": "Storage Connection String missing on server."})
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
        return JSONResponse(status_code=500, content={"error": str(e)})
