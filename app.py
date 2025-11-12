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
import google.generativeai as genai

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
    
    # Google (Gemini)
    GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]
    
    # NEW: Azure Document Intelligence
    DOC_INTEL_ENDPOINT = os.environ["DOC_INTEL_ENDPOINT"]
    DOC_INTEL_KEY = os.environ["DOC_INTEL_KEY"]
    
    # Azure Storage
    AZURE_STORAGE_CONNECTION_STRING = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    AZURE_STORAGE_CONTAINER = os.environ["AZURE_STORAGE_CONTAINER"]
except KeyError as e:
    logger.error(f"Missing environment variable: {e}")
    raise SystemExit(f"Startup failed: Missing environment variable {e}")

# !! CRITICAL: UPDATE THIS DEFAULT !!
DEFAULT_AZURE_DEPLOYMENT = "gpt-4o"  # <-- Your default Azure model

# !! CRITICAL: UPDATE THIS MAP !!
# This map routes tasks to your best models.
# We are using gpt-5-pro for drafting, as requested.
TASK_MODEL_MAP = {
    # --- Research & Analysis (Fast & Capable) ---
    "legal_research": "gpt-4o",
    "analyze_document": "gpt-4o",
    "build_chronology": "google/gemini-1.5-pro-latest",
    
    # --- High-Stakes Drafting (Best Models) ---
    "analyze_legal_argument": "gpt-5-pro", # <-- Using GPT-5 Pro
    "draft_exam_questions": "google/gemini-1.5-pro-latest",
    "draft_discovery_responses": "gpt-5-pro", # <-- Using GPT-5 Pro
    "draft_discovery_requests": "gpt-5-pro", # <-- Using GPT-5 Pro
    "draft_rfo": "gpt-5-pro",                # <-- Using GPT-5 Pro
    "draft_motion": "gpt-5-pro",               # <-- Using GPT-5 Pro
    "draft_brief": "gpt-5-pro",                # <-- Using GPT-5 Pro
}

# --- Initialize API Clients ---

# Azure OpenAI Client
azure_openai_client = AzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version="2024-02-01"
)

# Google (Gemini) Client
genai.configure(api_key=GOOGLE_API_KEY)

# NEW: Document Intelligence Client
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

# --- Pydantic Models (Request Bodies) ---

class SasRequest(BaseModel):
    filename: str

class CopilotRequest(BaseModel):
    jurisdiction: str
    task: str
    messages: list[dict]
    blob_name: str | None = None
    original_filename: str | None = None


# --- NEW: Helper Function (Replaces PyMuPDF) ---
def extract_document_content(file_bytes: bytes) -> str:
    """
    Analyzes a document from bytes using Azure AI Document Intelligence.
    """
    try:
        # Use "prebuilt-layout" to get all text and structure
        poller = doc_intel_client.begin_analyze_document(
            "prebuilt-layout", 
            analyze_request=file_bytes,
            content_type="application/octet-stream"
        )
        result = poller.result()
        
        # result.content contains the full, concatenated text
        return result.content

    except Exception as e:
        logger.error(f"Document Intelligence analysis failed: {e}")
        return f"Error: Could not read the document. It may be an unsupported format. {e}"


# --- API Routes ---

@app.get("/healthz")
async def healthz():
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
async def copilot_endpoint(request: CopilotRequest):
    """
    This unified endpoint routes to Azure OpenAI OR Google Gemini.
    """
    try:
        # 1. Select the model string
        model_name_string = TASK_MODEL_MAP.get(request.task, DEFAULT_AZURE_DEPLOYMENT)
        logger.info(f"Task: {request.task} -> Using Model: {model_name_string}")

        # 2. Build the dynamic system prompt
        system_prompt = f"You are Joogni, an expert legal copilot specializing in **{request.jurisdiction} Family Law**. Your current task is: **{request.task}**."
        
        # 3. Handle attached file (if any)
        file_context = ""
        if request.blob_name and request.original_filename:
            logger.info(f"Downloading blob: {request.blob_name}")
            try:
                blob_client = container_client.get_blob_client(request.blob_name)
                downloader = blob_client.download_blob()
                file_content = downloader.readall()
                logger.info(f"File downloaded, size: {len(file_content)} bytes")
                
                # --- THIS IS THE UPGRADE ---
                text_content = extract_document_content(file_content)
                # ---
                
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

        reply = ""

        # 5. Call the correct API
        if model_name_string.startswith("google/"):
            # --- It's a Google model ---
            google_model_name = model_name_string.split("google/")[1]
            
            gemini_messages = []
            for msg in user_messages:
                gemini_messages.append({'role': msg['role'], 'parts': [msg['content']]})

            model = genai.GenerativeModel(
                google_model_name,
                system_instruction=system_prompt
            )
            
            chat = model.start_chat(history=gemini_messages[:-1])
            api_response = chat.send_message(gemini_messages[-1]['parts'])
            reply = api_response.text

        else:
            # --- It's an Azure OpenAI model ---
            messages_to_send = [
                {"role": "system", "content": system_prompt}
            ]
            messages_to_send.extend(user_messages)
            
            completion = azure_openai_client.chat.completions.create(
                model=model_name_string, # This is the Azure deployment name
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
