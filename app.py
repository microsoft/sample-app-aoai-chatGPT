import os
import logging
import io
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AzureOpenAI
import anthropic # Import Anthropic
from azure.storage.blob import (
    BlobServiceClient,
    BlobSasPermissions,
    generate_blob_sas
)
import fitz  # PyMuPDF
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
    
    # Anthropic (Claude)
    CLAUDE_API_KEY = os.environ["CLAUDE_API_KEY"]
    
    # Azure Storage
    AZURE_STORAGE_CONNECTION_STRING = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    AZURE_STORAGE_CONTAINER = os.environ["AZURE_STORAGE_CONTAINER"]
except KeyError as e:
    logger.error(f"Missing environment variable: {e}")
    raise SystemExit(f"Startup failed: Missing environment variable {e}")

# !! CRITICAL: UPDATE THIS DEFAULT !!
# This is your fallback Azure deployment name.
DEFAULT_AZURE_DEPLOYMENT = "gpt-4o"  # <-- Make sure this is your deployment name!

# !! CRITICAL: UPDATE THIS MAP !!
# This map MUST match the 'value' attributes in your index.html
# !! CRITICAL: UPDATE THIS MAP !!
TASK_MODEL_MAP = {
    "legal_research": "gpt-4o",
    "build_chronology": "gpt-4o",
    "analyze_document": "gpt-4o",
    "analyze_legal_argument": "claude/claude-3-sonnet-20240229", # <-- NEW
    "draft_exam_questions": "claude/claude-3-sonnet-20240229", # <-- NEW
    "draft_discovery_responses": "claude/claude-3-sonnet-20240229", # <-- NEW
    "draft_discovery_requests": "claude/claude-3-sonnet-20240229", # <-- NEW
    "draft_rfo": "claude/claude-3-sonnet-20240229", # <-- NEW
    "draft_motion": "claude/claude-3-sonnet-20240229", # <-- NEW
    "draft_brief": "claude/claude-3-sonnet-20240229", # <-- NEW
}

# --- Initialize API Clients ---

# Azure OpenAI Client
azure_openai_client = AzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version="2024-02-01"
)

# NEW: Anthropic (Claude) Client
anthropic_client = anthropic.Anthropic(
    api_key=CLAUDE_API_KEY
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


# --- Helper Function: Extract Text from PDF ---
def extract_text_from_pdf(pdf_content: bytes) -> str:
    try:
        with fitz.open(stream=pdf_content, filetype="pdf") as doc:
            text = ""
            for page in doc:
                text += page.get_text()
            return text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {e}")
        return f"Error: Could not read the PDF file. It may be corrupted or password-protected. {e}"


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
    This unified endpoint now routes to EITHER Azure OpenAI OR Anthropic Claude.
    """
    try:
        # 1. Select the model string (e.g., "gpt-4o" or "claude/claude-3-opus...")
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
                
                text_content = extract_text_from_pdf(file_content)
                
                file_context = f"""--- BEGIN ATTACHED DOCUMENT: {request.original_filename} ---
{text_content[:20000]}
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

        # 5. --- NEW: Call the correct API based on the model string ---
        if model_name_string.startswith("claude/"):
            # It's a Claude model
            claude_model_name = model_name_string.split("claude/")[1]
            
            # Anthropic uses a separate 'system' parameter
            api_response = anthropic_client.messages.create(
                model=claude_model_name,
                system=system_prompt,
                messages=user_messages,
                max_tokens=4096
            )
            reply = api_response.content[0].text
        
        else:
            # It's an Azure OpenAI model
            # Azure expects the system prompt as the first message
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
