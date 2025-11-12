import os
import logging
import io
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- API Client Imports ---
from openai import AzureOpenAI

# NEW: Import Document Intelligence
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient

# --- Other Imports ---
from azure.storage.blob import (
    BlobServiceClient,
    BlobSasPermissions,
    generate_blob_sas
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
    
    # NEW: Azure Document Intelligence
    DOC_INTEL_ENDPOINT = os.environ["DOC_INTEL_ENDPOINT"]
    DOC_INTEL_KEY = os.environ["DOC_INTEL_KEY"]
    
    # Azure Storage
    AZURE_STORAGE_CONNECTION_STRING = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    AZURE_STORAGE_CONTAINER = os.environ["AZURE_STORAGE_CONTAINER"]
except KeyError as e:
    logger.error(f"Missing environment variable: {e}")
    raise SystemExit(f"Startup failed: Missing environment variable {e}")

# --- Model & Prompt Configuration ---

# This is your default model, the Azure model-router.
# Make sure this deployment name is correct.
DEFAULT_AZURE_DEPLOYMENT = "model-router" # <-- This now handles everything

# We no longer need the TASK_MODEL_MAP as everything goes to the router

# --- NEW: EXPERT PROMPT MAP ---
# This is the "brains" of your task selector.
# It gives a specific, high-quality system prompt for each task.
TASK_PROMPT_MAP = {
    "general_drafting": "You are Joogni, an expert writing assistant. Your task is to help the user draft or polish any form of text (letters, emails, memos, etc.). Adapt your tone and format based on their request. You are specializing in {jurisdiction} Family Law.",
    "legal_research": "You are Joogni, a legal research assistant. Provide concise, accurate answers. When possible, cite relevant {jurisdiction} statutes or case law. Do not hallucinate or invent citations.",
    "build_chronology": "You are Joogni, a case analyst. Your task is to build a detailed, event-by-event case chronology. Review the user's prompt and any attached documents. Extract key events, dates, and communications, then present them in a clear, reverse-chronological order (most recent first).",
    "analyze_document": "You are Joogni, a legal analyst. Your task is to analyze the attached document(s) and provide a comprehensive summary. Identify the document type, key parties, major factual points, and any stated legal claims or requests for relief.",
    "analyze_legal_argument": "You are Joogni, a senior litigator. Your task is to analyze the attached legal argument. First, summarize the main argument. Then, identify its core strengths and, most importantly, all logical fallacies, unsupported claims, weak evidence, and points of legal vulnerability.",
    "draft_exam_questions": "You are Joogni, a trial attorney. Your task is to draft examination questions. Based on the user's prompt and any attached documents (like declarations or transcripts), generate a set of both direct and cross-examination questions, clearly labeled.",
    "draft_discovery_responses": "You are Joogni, a discovery expert. Your task is to help draft discovery responses for {jurisdiction} law. Analyze the user's prompt and any attached propounded discovery. For each request, suggest boilerplate objections (e.g., 'overbroad', 'unduly burdensome', 'attorney-client privilege') and format a template for the user to provide their substantive answer.",
    "draft_discovery_requests": "You are Joogni, a discovery expert. Your task is to draft discovery requests (e.g., Form Interrogatories, Special Interrogatories, Requests for Production) for a {jurisdiction} Family Law case based on the user's prompt.",
    "draft_rfo": "You are Joogni, a {jurisdiction} Family Law paralegal. Your task is to draft a Request for Order (RFO) or a Responsive Declaration. Use the user's prompt and any attached documents. Format the response for a court filing, clearly stating the requested orders and the factual basis (declaration) to support them.",
    "draft_motion": "You are Joogni, a {jurisdiction} civil litigation specialist. Your task is to draft a formal motion. Use the user's prompt and attached documents. Your response should include a Notice of Motion, the Motion itself, a Points and Authorities, and a supporting Declaration.",
    "draft_brief": "You are Joogni, a legal writing expert. Your task is to draft a formal legal brief. Use the user's prompt and attached documents to construct a persuasive argument, complete with an introduction, statement of facts, legal argument section, and conclusion.",
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
container_client = blob_service_client.get_container_client(
    AZURE_STORAGE_CONTAINER
)
# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- Pydantic Models ---
class SasRequest(BaseModel):
    filename: str

class CopilotRequest(BaseModel):
    jurisdiction: str
    task: str
    messages: list[dict]
    blob_name: str | None = None
    original_filename: str | None = None

# --- Helper Function ---
def extract_document_content(file_bytes: bytes) -> str:
    """
    Analyzes a document from bytes using Azure AI Document Intelligence.
    """
    try:
        poller = doc_intel_client.begin_analyze_document(
            "prebuilt-layout", 
            analyze_request=file_bytes,
            content_type="application/octet-stream"
        )
        result = poller.result()
        if result.content:
            return result.content
        else:
            return "(Document appears to be empty or contains no extractable text.)"
    except Exception as e:
        logger.error(f"Document Intelligence analysis failed: {e}")
        return f"Error: Could not read the document. It may be an unsupported format. {e}"

# --- API Routes ---
@app.get("/healthz")
async def healthz():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/get-upload-url")
async def get_upload_url(request: SasRequest):
    """Generates a short-lived SAS URL for uploading a file."""
    try:
        blob_name = f"{uuid.uuid4()}-{request.filename}"
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=AZURE_STORAGE_CONTAINER,
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(create=True, write=True),
            expiry=datetime.now(timezone.utc) + timedelta(minutes=15)
        )
        # --- THIS IS THE CORRECT, COMPLETE LINE ---
        upload_url = (
            f"https://{blob_service_client.account_name}.blob.core.windows.net/"
            f"{AZURE_STORAGE_CONTAINER}/{blob_name}?{sas_token}"
        )
        # --- END OF FIX ---
        return {"upload_url": upload_url, "blob_name": blob_name}
    except Exception as e:
        logger.error(f"Error generating SAS URL: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Could not generate file upload URL: {e}"}
        )

# --- Main Copilot Endpoint (SIMPLIFIED) ---

@app.post("/api/copilot")
async def copilot_endpoint(request: CopilotRequest):
    """
    This endpoint now sends all requests to the default Azure Model Router.
    """
    try:
        # 1. Set the model to the default router
        model_name_string = DEFAULT_AZURE_DEPLOYMENT
        logger.info(f"Task: {request.task} -> Target: {model_name_string}")

        # 2. Build the dynamic system prompt
        prompt_template = TASK_PROMPT_MAP.get(request.task, DEFAULT_PROMPT)
        system_prompt = prompt_template.format(jurisdiction=request.jurisdiction)
        
        # 3. Handle attached file (if any)
        file_context = ""
        if request.blob_name and request.original_filename:
            logger.info(f"Downloading blob: {request.blob_name}")
            try:
                blob_client = container_client.get_blob_client(request.blob_name)
                downloader = blob_client.download_blob()
                file_content = downloader.readall()
                logger.info(f"File downloaded, size: {len(file_content)} bytes")
                
                text_content = extract_document_content(file_content)
                
                file_context = f"""--- BEGIN ATTACHED DOCUMENT: {request.original_filename} ---
{text_content}
--- END ATTACHED DOCUMENT ---

Based on the document above, """
                
            except Exception as e:
                logger.error(f"Failed to process file: {e}")
                file_context = f"(Error: Failed to read attached file {request.original_filename}. {e})\n\n"

        # 4. Combine file context with the user's last message
        user_messages = request.messages
        if file_context and user_messages:
            user_messages[-1]["content"] = file_context + user_messages[-1]["content"]

        # 5. Call the Azure OpenAI API
        messages_to_send = [
            {"role": "system", "content": system_prompt}
        ]
        messages_to_send.extend(user_messages)
        
        completion = azure_openai_client.chat.completions.create(
            model=model_name_string, # This is now "model-router"
            messages=messages_to_send
        )
        reply = completion.choices[0].message.content

        return {"reply": reply}

    except Exception as e:
        logger.error(f"Error in /api/copilot: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"An error occurred: {e}"}
        )

# --- Gunicorn/Uvicorn entry point ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
