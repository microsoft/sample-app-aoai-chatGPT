import os
import uuid
import logging
import sys
import requests # <--- NEW: For calling Microsoft Graph
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- IMPORTS FOR BLOB STORAGE ---
# (AI imports are lazy-loaded to prevent startup crashes)
from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas

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

# --- 1. DEFINITIONS ---
class SasRequest(BaseModel):
    filename: str

# --- 2. GLOBAL STATE ---
JOBS = {}

# --- 3. HELPER: GRAPH AUTH ---
def get_graph_headers(req: Request):
    """
    Extracts the User's Access Token injected by Azure App Service Authentication.
    This allows the backend to act on behalf of the logged-in user.
    """
    # Azure injects this header when "App Service Authentication" is on
    token = req.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN")
    
    # Fallback for local testing (Optional: set TEST_GRAPH_TOKEN in .env)
    if not token:
        token = os.getenv("TEST_GRAPH_TOKEN")
        
    if not token:
        # If no token, we can't search their email.
        # We log a warning but return None to handle it gracefully in the route
        logger.warning("No X-MS-TOKEN-AAD-ACCESS-TOKEN found.")
        return None
        
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# --- 4. ROUTES (CORE) ---

@app.get("/")
async def root():
    return {"status": "Online", "message": "Joogni Backend (Graph Enabled) is Running"}

@app.post("/api/copilot")
async def start_copilot_job(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        job_id = str(uuid.uuid4())
        background_tasks.add_task(lazy_copilot_task, job_id, data)
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
    try:
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container = os.getenv("AZURE_STORAGE_CONTAINER")
        
        if not connect_str or not container:
            return JSONResponse(status_code=500, content={"error": "Storage Config Missing"})

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
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- 5. ROUTES (MICROSOFT GRAPH) ---

@app.post("/api/search-outlook")
async def search_outlook(request: Request):
    """Searches the user's Outlook emails."""
    try:
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated with Microsoft. Please refresh the page."})

        data = await request.json()
        query = data.get("query", "")
        
        url = "https://graph.microsoft.com/v1.0/me/messages"
        params = {
            "$top": 15,
            "$select": "id,subject,from,receivedDateTime,bodyPreview,hasAttachments",
            "$filter": "hasAttachments eq true", # Only show emails with files
            "$orderby": "receivedDateTime desc"
        }
        
        if query:
            # Add search query if provided
            params["$search"] = f'"{query}"'
            
        # Call Microsoft Graph
        resp = requests.get(url, headers=headers, params=params)
        
        if resp.status_code != 200:
            logger.error(f"Graph Error: {resp.text}")
            return JSONResponse(status_code=resp.status_code, content={"error": "Failed to search Outlook"})
            
        return resp.json()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/search-outlook/{message_id}/attachments")
async def get_outlook_attachments(message_id: str, request: Request):
    """Gets the list of attachments for a specific email."""
    try:
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated"})

        url = f"https://graph.microsoft.com/v1.0/me/messages/{message_id}/attachments"
        
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            return JSONResponse(status_code=resp.status_code, content={"error": "Failed to fetch attachments"})
            
        return resp.json()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/download-graph-file")
async def download_graph_file(request: Request):
    """
    Downloads a file from Graph (Outlook/OneDrive) and uploads it to our Blob Storage.
    This creates the bridge between 'User Data' and 'AI Context'.
    """
    try:
        data = await request.json()
        download_url = data.get("download_url") # The magic URL from Graph
        file_name = data.get("file_name", "unknown_file")
        
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated"})
        
        # 1. Download content from Graph (using User's Token)
        graph_resp = requests.get(download_url, headers=headers)
        
        if graph_resp.status_code != 200:
            return JSONResponse(status_code=400, content={"error": "Could not download file from Microsoft Graph"})
            
        file_content = graph_resp.content # Read into memory (OK for <50MB)

        # 2. Upload to Azure Blob Storage (System Storage)
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container = os.getenv("AZURE_STORAGE_CONTAINER")
        
        blob_service = BlobServiceClient.from_connection_string(connect_str)
        new_blob_name = f"graph-{uuid.uuid4()}-{file_name}"
        
        blob_client = blob_service.get_blob_client(container=container, blob=new_blob_name)
        blob_client.upload_blob(file_content, overwrite=True)
        
        # 3. Return the Blob Info (matches what handleFileUpload produces)
        return {
            "blob_name": new_blob_name,
            "original_filename": file_name,
            "source": "microsoft_graph"
        }

    except Exception as e:
        logger.error(f"Graph Download Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- 6. BACKGROUND TASK (THREADED) ---
def lazy_copilot_task(job_id: str, data: dict):
    JOBS[job_id] = {"status": "Pending", "result": ""}
    debug_log = [] 
    
    try:
        # 1. BASE IMPORTS
        try:
            from openai import AzureOpenAI
            from azure.core.credentials import AzureKeyCredential
        except ImportError as e:
            raise ImportError(f"Base Library Failed: {e}")

        # 2. EXTRACT FILES
        blobs = data.get("blobs", [])
        file_context = ""
        
        if blobs:
            try:
                from azure.ai.documentintelligence import DocumentIntelligenceClient
                from azure.storage.blob import BlobServiceClient
                
                storage_conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
                storage_cont = os.getenv("AZURE_STORAGE_CONTAINER")
                doc_endpoint = os.getenv("DOC_INTEL_ENDPOINT")
                doc_key = os.getenv("DOC_INTEL_KEY")
                
                if storage_conn and doc_endpoint:
                    blob_service = BlobServiceClient.from_connection_string(storage_conn)
                    container_client = blob_service.get_container_client(storage_cont)
                    doc_client = DocumentIntelligenceClient(endpoint=doc_endpoint, credential=AzureKeyCredential(doc_key))
                    
                    for blob_info in blobs:
                        b_name = blob_info.get("blob_name")
                        f_name = blob_info.get("original_filename")
                        try:
                            blob_client = container_client.get_blob_client(b_name)
                            file_data = blob_client.download_blob().readall()
                            
                            poller = doc_client.begin_analyze_document("prebuilt-layout", body=file_data)
                            result = poller.result()
                            text = result.content or "(No Text)"
                            file_context += f"\n--- FILE: {f_name} ---\n{text}\n"
                        except Exception as e:
                            debug_log.append(f"Err {f_name}: {str(e)}")
            except Exception as e:
                debug_log.append(f"File Process Error: {e}")

        # 3. SAFETY VALVE (Token Limit Check)
        # Approx 1 token ~= 4 characters. 120k tokens ~= 480k chars.
        if len(file_context) > 500000:
            JOBS[job_id]["status"] = "Failed"
            JOBS[job_id]["result"] = "⚠️ **Limit Exceeded:** The documents are too large (Over 120,000 tokens). Please upload fewer or smaller files to prevent a system crash."
            return

        # 4. RUN AI
        key = os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        
        if not key:
            raise ValueError("Azure OpenAI Key Missing")

        client = AzureOpenAI(api_key=key, azure_endpoint=endpoint, api_version="2024-02-01")
        
        task = data.get("task", "general")
        user_msg = data.get("messages", [])[-1].get("content", "")
        
        final_prompt = f"{file_context}\n\nUser Query: {user_msg}"
        
        completion = client.chat.completions.create(
            model="model-router",
            messages=[
                {"role": "system", "content": f"You are Joogni, an expert legal AI. Current Task: {task}"},
                {"role": "user", "content": final_prompt}
            ]
        )
        
        JOBS[job_id]["status"] = "Complete"
        JOBS[job_id]["result"] = completion.choices[0].message.content

    except Exception as e:
        logger.error(f"Job Failed: {e}")
        JOBS[job_id]["status"] = "Failed"
        JOBS[job_id]["result"] = f"Error: {str(e)}"
