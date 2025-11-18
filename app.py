import os
import logging
import io
import uuid
import json
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# --- NEW IMPORTS FOR PARALLEL PROCESSING ---
import asyncio
import concurrent.futures

# --- API Client Imports ---
from openai import AzureOpenAI
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient

# --- NEW: MSAL & Requests for Graph API ---
import msal
import requests

# --- Other Imports ---
from azure.storage.blob import (
    BlobServiceClient,
    BlobSasPermissions,
    generate_blob_sas,
    ContainerClient
)
from dotenv import load_dotenv

# --- Configuration & Clients ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# 🔐 Load Environment Variables
try:
    # Azure OpenAI
    AZURE_OPENAI_KEY = os.environ["AZURE_OPENAI_KEY"]
    AZURE_OPENAI_ENDPOINT = os.environ["AZURE_OPENAI_ENDPOINT"]
    
    # Azure Document Intelligence
    DOC_INTEL_ENDPOINT = os.environ["DOC_INTEL_ENDPOINT"]
    DOC_INTEL_KEY = os.environ["DOC_INTEL_KEY"]
    
    # Azure Storage
    AZURE_STORAGE_CONNECTION_STRING = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    AZURE_STORAGE_CONTAINER = os.environ["AZURE_STORAGE_CONTAINER"]
    AZURE_JOB_STATUS_CONTAINER = "jobstatus"

    # --- NEW: Load Graph API Secrets ---
    AZURE_CLIENT_ID = os.environ["AZURE_CLIENT_ID"]
    AZURE_CLIENT_SECRET = os.environ["AZURE_CLIENT_SECRET"]
    AZURE_TENANT_ID = os.environ["AZURE_TENANT_ID"]
    GRAPH_AUTHORITY = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}"

except KeyError as e:
    logger.error(f"Missing critical environment variable: {e}")
    # This will cause the app to fail on startup, which is visible in the Log Stream
    raise SystemExit(f"Startup failed: Missing critical environment variable {e}")

# --- Model & Prompt Configuration ---
DEFAULT_AZURE_DEPLOYMENT = "model-router"

# --- Task Prompts ---
TASK_PROMPT_MAP = {
    "general_drafting": "You are Joogni, an expert writing assistant. Your task is to help the user draft or polish any form of text (letters, emails, memos, etc.). Adapt your tone and format based on their request. You are specializing in {jurisdiction} Family Law. Use Markdown for formatting (e.g., **bold**, *italics*, lists).",
    "legal_research": "You are Joogni, a legal research assistant. Provide concise, accurate answers. When possible, cite relevant {jurisdiction} statutes or case law. Do not hallucinate or invent citations. Format your answer clearly using Markdown.",
    "build_chronology": """You are Joogni, an expert legal case analyst for {jurisdiction} Family Law. Your task is to build a detailed, event-by-event case chronology from all attached documents.
    
    Format your response using rich Markdown in reverse-chronological order (most recent first):
    - Use numbered lists for primary events (e.g., `1)`, `2)`).
    - Use **bold text** for dates and a summary of the event (e.g., "**11/12/2025 — Substitution of Attorney**").
    - Use nested bullet points (using `-`) for details.
    - Use *italics* for document titles (e.g., *- Document: *Substitution of Attorney (MC-050)*...*).
    
    Example:
    1. **11/12/2025 — Substitution of Attorney (MC-050) mailed/served**
       - *Document:* MC-050 (Substitution of Attorney – civil)
       - *Event:* Former counsel (Silicon Valley Law Offices) served a Substitution of Attorney form showing Respondent as "in pro per".
    """,
    "analyze_document": """You are Joogni, an expert legal analyst for {jurisdiction} Family Law. Your task is to analyze all attached documents and provide a practical, litigation-ready organization of the materials.
    
    Format your response using rich Markdown, including:
    - Headings for functional categories (e.g., "A. Core Motions", "B. Exhibits", "C. Expert Materials").
    - Nested numbered lists for individual documents.
    - **bold text** for "Recommendation:", "Gap:", "Risk:", or "Action:".
    - *Italics* for document titles or key observations.
    
    For each document, provide:
    1. A short description of the item.
    2. Its evidentiary status or role.
    3. A recommended action.
    
    Conclude with a summary of Gaps, Risks, and a practical Filing Plan.""",
    "analyze_legal_argument": """You are Joogni, a senior litigator for {jurisdiction} Family Law. Your task is to analyze the attached legal argument(s).
    
    Format your response using rich Markdown, including:
    - Headings for key sections (e.g., "A. Summary of Argument", "B. Core Strengths", "C. Vulnerabilities & Gaps").
    - Nested bullet points (using `-` or `1.`) for your analysis.
    - **Bold text** for "Recommendation:", "Risk:", or "Action:".
    
    Your analysis must identify:
    1. The core legal and factual claims.
    2. Strengths in the argument.
    3. All logical fallacies, unsupported claims, weak evidence, and points of legal vulnerability.
    4. A final, practical recommendation for how to defeat this argument.""",
    "draft_exam_questions": "You are Joogni, a trial attorney. Your task is to draft examination questions. Based on the user's prompt and any attached documents (like declarations or transcripts), generate a set of both **Direct** and **Cross-Examination** questions, clearly labeled.",
    "draft_discovery_responses": "You are Joogni, a discovery expert. Your task is to help draft discovery responses for {jurisdiction} law. Analyze the user's prompt and any attached propounded discovery. For each request, suggest boilerplate objections (e.g., **Objection: Overbroad**, **Objection: Unduly Burdensome**) and format a template.",
    "draft_discovery_requests": "You are Joogni, a discovery expert. Your task is to draft discovery requests (e.g., Form Interrogatories, Special Interrogatories, Requests for Production) for a {jurisdiction} Family Law case based on the user's prompt. Use clear numbering and sub-parts.",
    "draft_rfo": "You are Joogni, a {jurisdiction} Family Law paralegal. Your task is to draft a Request for Order (RFO) or a Responsive Declaration. Use the user's prompt and any attached documents. Format the response for a court filing, clearly stating the **Requested Orders** and the **Factual Basis (Declaration)** to support them.",
    "draft_motion": "You are Joogni, a {jurisdiction} civil litigation specialist. Your task is to draft a formal motion. Use the user's prompt and attached documents. Your response should include a **Notice of Motion**, the **Motion**, a **Memorandum of Points and Authorities**, and a **Supporting Declaration**.",
    "draft_brief": "You are Joogni, a legal writing expert. Your task is to draft a formal legal brief. Use the user's prompt and attached documents to construct a persuasive argument, complete with an **Introduction**, **Statement of Facts**, **Legal Argument** section, and **Conclusion**."
}
DEFAULT_PROMPT = "You are Joogni, an expert legal copilot specializing in {jurisdiction} Family Law."


# --- Initialize API Clients ---

# Azure OpenAI Client
azure_openai_client = AzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version="2024-02-01"
)

# Document Intelligence Client
doc_intel_client = DocumentIntelligenceClient(
    endpoint=DOC_INTEL_ENDPOINT,
    credential=AzureKeyCredential(DOC_INTEL_KEY)
)
# Azure Blob Storage Client
blob_service_client = BlobServiceClient.from_connection_string(
    AZURE_STORAGE_CONNECTION_STRING
)
# Client for file uploads
file_upload_container_client = blob_service_client.get_container_client(
    AZURE_STORAGE_CONTAINER
)
# Client for job status
job_status_container_client = blob_service_client.get_container_client(
    AZURE_JOB_STATUS_CONTAINER
)

# --- NEW: MSAL Client for Graph API ---
msal_app = msal.ConfidentialClientApplication(
    client_id=AZURE_CLIENT_ID,
    authority=GRAPH_AUTHORITY,
    client_credential=AZURE_CLIENT_SECRET
)
# --- END NEW ---

# --- Pydantic Models ---
class SasRequest(BaseModel):
    filename: str

class FileInfo(BaseModel):
    blob_name: str
    original_filename: str

class CopilotRequest(BaseModel):
    jurisdiction: str
    task: str
    messages: list[dict]
    blobs: list[FileInfo] | None = None

# --- NEW: Pydantic Models for Graph API ---
class GraphSearchRequest(BaseModel):
    query: str

class GraphFileDownloadRequest(BaseModel):
    file_id: str
    file_name: str
    download_url: str

# --- Helper Functions ---
def extract_document_content(file_bytes: bytes, content_type: str) -> str:
    """
    Analyzes a document from bytes using Azure AI Document Intelligence.
    """
    try:
        poller = doc_intel_client.begin_analyze_document(
            "prebuilt-layout",
            document=file_bytes, # <-- THIS IS THE FIX (was 'body=')
            content_type=content_type
        )
        result = poller.result()
        if result.content:
            return result.content
        else:
            return "(Document appears to be empty or contains no extractable text.)"
    except Exception as e:
        logger.error(f"Document Intelligence analysis failed: {e}")
        return f"Error: Could not read the document. It may be an unsupported format. {e}"

def download_and_extract_content(file: FileInfo) -> str:
    """
    This is a helper function that contains all the slow, blocking
    I/O operations for a *single* file. We will run this function
    in parallel for all files.
    """
    try:
        logger.info(f"[Thread] Processing {file.original_filename}")
        blob_client = file_upload_container_client.get_blob_client(file.blob_name)
        downloader = blob_client.download_blob()
        file_content = downloader.readall()
        blob_properties = blob_client.get_blob_properties()
        file_content_type = blob_properties.content_settings.content_type
        logger.info(f"[Thread] {file.original_filename} downloaded, size: {len(file_content)} bytes")
        text_content = extract_document_content(file_content, file_content_type)
        return f"--- BEGIN ATTACHED DOCUMENT: {file.original_filename} ---\n{text_content}\n--- END ATTACHED DOCUMENT ---"
    except Exception as e:
        logger.error(f"[Thread] Failed to process file {file.original_filename}: {e}")
        return f"(Error: Failed to read attached file {file.original_filename}. {e})\n"

async def run_copilot_task(request: CopilotRequest, job_id: str):
    """
    This function contains ALL the slow logic and runs in the background.
    """
    job_blob_name = f"{job_id}.json"
    reply = "" # Initialize reply variable

    try:
        logger.info(f"Job {job_id}: Task started.")
        # 1. Build the dynamic system prompt
        prompt_template = TASK_PROMPT_MAP.get(request.task, DEFAULT_PROMPT)
        system_prompt = prompt_template.format(jurisdiction=request.jurisdiction)
       
        # 2. Process all files in parallel (This is the slow part)
        file_context = ""
        if request.blobs:
            logger.info(f"Job {job_id}: Processing {len(request.blobs)} files in parallel...")
            loop = asyncio.get_event_loop()
            tasks = []
            with concurrent.futures.ThreadPoolExecutor() as executor:
                for file in request.blobs:
                    tasks.append(
                        loop.run_in_executor(
                            executor,
                            download_and_extract_content,
                            file
                        )
                    )
                all_file_content = await asyncio.gather(*tasks)
            file_context = "\n\n".join(all_file_content)
            if file_context:
                file_context += "\n\nBased on all the documents above, "
        logger.info(f"Job {job_id}: File processing complete.")

        # 3. Combine file context with the user's last message
        user_messages = request.messages
        if file_context and user_messages:
            user_messages[-1]["content"] = file_context + user_messages[-1]["content"]

        # 4. All requests now go to Azure OpenAI
        logger.info(f"Job {job_id}: Routing task '{request.task}' to Azure Model Router.")
        messages_to_send = [
            {"role": "system", "content": system_prompt}
        ]
        messages_to_send.extend(user_messages)
    
        completion = azure_openai_client.chat.completions.create(
            model=DEFAULT_AZURE_DEPLOYMENT, # This is "model-router"
            messages=messages_to_send
        )
        reply = completion.choices[0].message.content
        logger.info(f"Job {job_id}: Azure response received.")
        
        # 5. Store the final result in Blob Storage
        job_data = {"status": "Complete", "result": reply}
        job_status_container_client.upload_blob(
            name=job_blob_name,
            data=json.dumps(job_data),
            overwrite=True
        )
        logger.info(f"Job {job_id}: Result saved to blob.")

    except Exception as e:
        logger.error(f"Error in background Job {job_id}: {e}")
        job_data = {"status": "Failed", "result": f"An error occurred: {e}"}
        job_status_container_client.upload_blob(
            name=job_blob_name,
            data=json.dumps(job_data),
            overwrite=True
        )

# --- NEW: Graph API Token Helper ---
async def _get_graph_token(fastapi_request: Request):
    """
    Gets a Graph API access token on behalf of the logged-in user.
    """
    # Get the user's access token (passed by the Static Web App proxy)
    user_token = fastapi_request.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN")
    if not user_token:
        logger.error("Graph token helper: X-MS-TOKEN-AAD-ACCESS-TOKEN header missing.")
        raise HTTPException(status_code=401, detail="User access token not found.")
        
    scopes = ["Mail.Read", "Files.Read.All"] # The permissions you granted
    
    # Try to get a new token from MSAL cache
    result = msal_app.acquire_token_on_behalf_of(
        user_assertion=user_token,
        scopes=scopes
    )
    
    if "error" in result:
        logger.error(f"MSAL Error: {result.get('error_description')}")
        raise HTTPException(status_code=500, detail=f"Failed to acquire Graph token: {result.get('error_description')}")
        
    if "access_token" not in result:
        logger.error("MSAL did not return an access token.")
        raise HTTPException(status_code=500, detail="Failed to acquire Graph token.")
        
    return result["access_token"]


# --- NEW: Graph API Endpoints ---

@app.post("/api/search-outlook")
async def search_outlook(search_request: GraphSearchRequest, fastapi_request: Request):
    """
    Searches the user's email for attachments.
    """
    try:
        graph_token = await _get_graph_token(fastapi_request)
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"error": e.detail})

    headers = {"Authorization": f"Bearer {graph_token}"}
    
    # Search for emails that HAVE attachments and match the query
    search_query = search_request.query
    search_url = (
        "https://graph.microsoft.com/v1.0/me/messages?"
        "$search=" + (f'"{search_query}"' if search_query else "") +
        "&$filter=hasAttachments eq true"
        "&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments"
        "&$top=25"
        "&$orderby=receivedDateTime desc"
    )

    try:
        response = requests.get(search_url, headers=headers)
        response.raise_for_status() # Raise an error for bad responses (4xx, 5xx)
        return response.json()
    except Exception as e:
        logger.error(f"Graph API error (Outlook): {e}")
        return JSONResponse(status_code=500, content={"error": f"Failed to search Outlook: {e}"})

@app.get("/api/search-outlook/{email_id}/attachments")
async def get_email_attachments(email_id: str, fastapi_request: Request):
    """
    Gets the list of attachments for a specific email ID.
    """
    try:
        graph_token = await _get_graph_token(fastapi_request)
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"error": e.detail})

    headers = {"Authorization": f"Bearer {graph_token}"}
    attachments_url = f"https://graph.microsoft.com/v1.0/me/messages/{email_id}/attachments?$select=id,name,contentType,size,isInline"

    try:
        response = requests.get(attachments_url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Graph API error (Attachments): {e}")
        return JSONResponse(status_code=500, content={"error": f"Failed to get attachments: {e}"})

@app.post("/api/search-onedrive")
async def search_onedrive(search_request: GraphSearchRequest, fastapi_request: Request):
    """
    Searches the user's OneDrive for files.
    """
    try:
        graph_token = await _get_graph_token(fastapi_request)
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"error": e.detail})

    headers = {"Authorization": f"Bearer {graph_token}"}
    
    # Search OneDrive
    search_query = search_request.query
    search_url = (
        "https->/graph.microsoft.com/v1.0/me/drive/root/"
        "search(q='" + search_query + "')?"
        "$select=id,name,webUrl,size,file,createdDateTime,@microsoft.graph.downloadUrl"
        "&$top=25"
    )
    if not search_query:
        # If no query, just get recent files
         search_url = (
            "https://graph.microsoft.com/v1.0/me/drive/recent?"
            "$select=id,name,webUrl,size,file,createdDateTime,@microsoft.graph.downloadUrl"
            "&$top=25"
         )

    try:
        response = requests.get(search_url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Graph API error (OneDrive): {e}")
        return JSONResponse(status_code=500, content={"error": f"Failed to search OneDrive: {e}"})

@app.post("/api/download-graph-file")
async def download_graph_file(download_request: GraphFileDownloadRequest, fastapi_request: Request):
    """
    Downloads a file from Graph (Outlook/OneDrive) and saves it
    to our app's blob storage.
    Returns the FileInfo object for the main /api/copilot call.
    """
    
    try:
        graph_token = await _get_graph_token(fastapi_request)
        headers = {"Authorization": f"Bearer {graph_token}"}

        # 1. Download the file from the Graph download URL
        logger.info(f"Graph download: Starting {download_request.file_name}")
        response = requests.get(download_request.download_url, headers=headers)
        response.raise_for_status()
        file_bytes = response.content
        file_content_type = response.headers.get("Content-Type", "application/octet-stream")
        logger.info(f"Graph download: File downloaded, size: {len(file_bytes)} bytes")

        # 2. Upload the raw file bytes to our app's blob storage
        blob_name = f"graph-{uuid.uuid4()}-{download_request.file_name}"
        file_upload_container_client.upload_blob(
            name=blob_name,
            data=file_bytes,
            overwrite=True,
            content_settings={"content_type": file_content_type}
        )
        logger.info(f"Graph download: File uploaded to {blob_name}")
        
        # 3. Return the new FileInfo object
        return {
            "blob_name": blob_name,
            "original_filename": download_request.file_name
        }

    except Exception as e:
        logger.error(f"Graph file download failed: {e}")
        return JSONResponse(status_code=500, content={"error": f"Failed to process Graph file: {e}"})


# --- Core API Routes ---
@app.get("/healthz")
async def healthz():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/get-upload-url")
async def get_upload_url(request: SasRequest):
    """Generates a short-lived SAS URL for uploading a file."""
    try:
        blob_name = f"{uuid.uuid4()}-{request.filename}" # Fixed typo
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=AZURE_STORAGE_CONTAINER,
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(create=True, write=True),
            expiry=datetime.now(timezone.utc) + timedelta(minutes=15)
        )
        upload_url = (
            f"https://{blob_service_client.account_name}.blob.core.windows.net/"
            f"{AZURE_STORAGE_CONTAINER}/{blob_name}?{sas_token}"
        )
        return {"upload_url": upload_url, "blob_name": blob_name}
    except Exception as e:
        logger.error(f"Error generating SAS URL: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Could not generate file upload URL: {e}"}
        )

@app.post("/api/copilot")
async def copilot_endpoint(request: CopilotRequest, background_tasks: BackgroundTasks):
    """
    This endpoint is asynchronous.
    It starts a background task and returns a job_id immediately.
    """
    try:
        job_id = str(uuid.uuid4())
        job_blob_name = f"{job_id}.json"
        
        # 1. Create the initial "Pending" status file in Blob Storage
        job_data = {"status": "Pending", "result": None}
        job_status_container_client.upload_blob(
            name=job_blob_name,
            data=json.dumps(job_data),
            overwrite=True
        )
        
        # 2. Start the slow, heavy work in the background
        # This line was failing because `run_copilot_task` was not defined
        background_tasks.add_task(run_copilot_task, request, job_.id)
        
        # 3. Return the job_id to the frontend immediately
        logger.info(f"Job {job_id}: Started successfully.")
        return {"job_id": job_id}

    except Exception as e:
        logger.error(f"Error starting job: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"An error occurred starting the job: {e}"}
        )

@app.get("/api/check_status/{job_id}")
async def check_status(job_id: str):
    """
    A new endpoint for the frontend to poll (ask) for the job status
    by reading the JSON file from Blob Storage.
    """
    job_blob_name = f"{job_id}.json"
    try:
        # 1. Get the job status blob
        blob_client = job_status_container_client.get_blob_client(job_blob_name)
        downloader = blob_client.download_blob()
        data_bytes = downloader.readall()
        job = json.loads(data_bytes)

    except Exception as e:
        # This will catch if the blob doesn't exist (e.g., a typo in job_id)
        # This is now *expected* behavior while the job is starting.
        # We return "Pending" to the frontend.
        logger.info(f"Job {job_id} status file not found, assuming Pending.")
        return {"status": "Pending", "result": None}
    
    # 2. If the job is complete, delete the status blob to clean up
    if job["status"] == "Complete" or job["status"] == "Failed":
        try:
            job_status_container_client.delete_blob(job_blob_name)
        except Exception as e:
            logger.warning(f"Failed to delete job status blob {job_blob_name}: {e}")
    
    # 3. Return the job status
    return job

# --- Gunicorn/Uvicorn entry point ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
