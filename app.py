import os
import logging
import io
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
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
    OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
    AZURE_STORAGE_CONNECTION_STRING = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    AZURE_STORAGE_CONTAINER = os.environ["AZURE_STORAGE_CONTAINER"]
except KeyError as e:
    logger.error(f"Missing environment variable: {e}")
    # In a real app, you might want to exit or raise an exception
    # For now, we'll let it fail loudly if a route is called.

#  OpenAI Client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Azure Blob Storage Client
blob_service_client = BlobServiceClient.from_connection_string(
    AZURE_STORAGE_CONNECTION_STRING
)
container_client = blob_service_client.get_container_client(
    AZURE_STORAGE_CONTAINER
)


# --- CORS Middleware ---
# Allow your frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, lock this to your SWA URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Models (Request Bodies) ---
class ChatRequest(BaseModel):
    messages: list[dict]

class SasRequest(BaseModel):
    filename: str

class SummarizeRequest(BaseModel):
    blob_name: str
    original_filename: str


# --- Helper Function: Extract Text from PDF ---
def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extracts text from PDF content."""
    try:
        with fitz.open(stream=pdf_content, filetype="pdf") as doc:
            text = ""
            for page in doc:
                text += page.get_text()
            return text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {e}")
        raise ValueError(f"Could not read the PDF file. It may be corrupted or password-protected.")


# --- API Routes ---

@app.get("/healthz")
async def healthz():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/conversation")
async def conversation(request: ChatRequest):
    """Handles standard text-based chat conversations."""
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=request.messages
        )
        reply = completion.choices[0].message.content
        return {"reply": reply}
    except Exception as e:
        logger.error(f"Error in /conversation: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"An error occurred with the chat model: {e}"}
        )


@app.post("/api/get-upload-url")
async def get_upload_url(request: SasRequest):
    """Generates a short-lived SAS URL for uploading a file."""
    try:
        # Create a unique blob name to prevent overwrites
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


@app.post("/summarize_file")
async def summarize_file(request: SummarizeRequest):
    """
    Downloads a file from blob storage, extracts text, and summarizes it.
    This is the fix for the crash you saw.
    """
    try:
        # 1. Download the file from Azure Blob Storage
        logger.info(f"Downloading blob: {request.blob_name}")
        blob_client = container_client.get_blob_client(request.blob_name)
        
        downloader = blob_client.download_blob()
        file_content = downloader.readall()
        logger.info(f"File downloaded, size: {len(file_content)} bytes")

        # 2. Extract text (assuming PDF for now)
        # In a real app, you'd check the file type
        try:
            text_content = extract_text_from_pdf(file_content)
            if not text_content.strip():
                raise ValueError("No text could be extracted from the file.")
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return JSONResponse(
                status_code=400,
                content={"error": str(e)}
            )
            
        logger.info(f"Text extracted, length: {len(text_content)} chars")

        # 3. Summarize with OpenAI
        prompt = f"""
        Please provide a concise summary of the following document.
        Original filename: {request.original_filename}

        Document Content:
        ---
        {text_content[:20000]}
        ---
        """
        
        # Note: We truncate text to avoid exceeding token limits.
        # A more advanced implementation would chunk the text.

        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert document summarizer."},
                {"role": "user", "content": prompt}
            ]
        )
        summary = completion.choices[0].message.content
        return {"summary": summary}

    # This is the crucial 'catch-all' that prevents the crash
    except Exception as e:
        logger.error(f"Error in /summarize_file: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to process the file: {e}"}
        )

# --- Gunicorn/Uvicorn entry point ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
