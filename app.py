import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from azure.storage.blob import (
    BlobServiceClient,
    BlobSasPermissions,
    generate_blob_sas,
)

from openai import AzureOpenAI

# -------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------
logger = logging.getLogger("app")
logging.basicConfig(level=logging.INFO)


# -------------------------------------------------------------------
# Config
# -------------------------------------------------------------------
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_DEPLOYMENT = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")

STORAGE_ACCOUNT_NAME = os.environ.get("AZURE_STORAGE_ACCOUNT")
STORAGE_ACCOUNT_KEY = os.environ.get("AZURE_STORAGE_KEY")
STORAGE_CONNECTION_STRING = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
STORAGE_CONTAINER_NAME = os.environ.get("AZURE_STORAGE_CONTAINER", "chatuploads")

if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_API_KEY:
    raise RuntimeError("Azure OpenAI config missing (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY).")

if not (STORAGE_CONNECTION_STRING or (STORAGE_ACCOUNT_NAME and STORAGE_ACCOUNT_KEY)):
    raise RuntimeError(
        "Azure Storage config missing. Set AZURE_STORAGE_CONNECTION_STRING or "
        "AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_KEY."
    )

# -------------------------------------------------------------------
# Azure Blob setup
# -------------------------------------------------------------------
if STORAGE_CONNECTION_STRING:
    blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
    account_name_for_sas = blob_service_client.account_name
else:
    blob_service_client = BlobServiceClient(
        account_url=f"https://{STORAGE_ACCOUNT_NAME}.blob.core.windows.net",
        credential=STORAGE_ACCOUNT_KEY,
    )
    account_name_for_sas = STORAGE_ACCOUNT_NAME

container_client = blob_service_client.get_container_client(STORAGE_CONTAINER_NAME)
try:
    container_client.create_container()
    logger.info("Created container: %s", STORAGE_CONTAINER_NAME)
except Exception:
    logger.info("Storage configured for container: %s", STORAGE_CONTAINER_NAME)

# -------------------------------------------------------------------
# Azure OpenAI client
# -------------------------------------------------------------------
client = AzureOpenAI(
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_key=AZURE_OPENAI_API_KEY,
    api_version="2024-08-01-preview",
)

# -------------------------------------------------------------------
# FastAPI app
# -------------------------------------------------------------------
app = FastAPI(title="Joogni Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# Models
# -------------------------------------------------------------------
class UploadUrlRequest(BaseModel):
    filename: str


class UploadUrlResponse(BaseModel):
    blob_name: str
    upload_url: str


class FileRef(BaseModel):
    blob_name: str


class CreateJobRequest(BaseModel):
    task: str
    message: str
    files: List[FileRef] = []


class JobResponse(BaseModel):
    job_id: str
    result: dict


# -------------------------------------------------------------------
# Helpers: SAS URLs
# -------------------------------------------------------------------
def generate_blob_write_sas(blob_name: str) -> str:
    """
    SAS URL for the frontend to PUT the original upload.
    """
    sas_token = generate_blob_sas(
        account_name=account_name_for_sas,
        container_name=STORAGE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=STORAGE_ACCOUNT_KEY,
        permission=BlobSasPermissions(create=True, write=True),
        expiry=datetime.utcnow() + timedelta(hours=1),
    )
    url = f"https://{account_name_for_sas}.blob.core.windows.net/{STORAGE_CONTAINER_NAME}/{blob_name}?{sas_token}"
    return url


def generate_blob_read_sas(blob_name: str) -> str:
    """
    SAS URL for GPT / backend to READ the PDF.
    """
    sas_token = generate_blob_sas(
        account_name=account_name_for_sas,
        container_name=STORAGE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=STORAGE_ACCOUNT_KEY,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=1),
    )
    url = f"https://{account_name_for_sas}.blob.core.windows.net/{STORAGE_CONTAINER_NAME}/{blob_name}?{sas_token}"
    return url


def save_result_to_blob(job_id: str, result: dict) -> None:
    """
    Store GPT result JSON at results/{job_id}.json
    """
    blob_name = f"results/{job_id}.json"
    data = json.dumps(result, ensure_ascii=False).encode("utf-8")
    container_client.upload_blob(name=blob_name, data=data, overwrite=True)
    logger.info("Saved result for job: %s", job_id)


def build_message_content(task: str, user_message: str, file_blob_names: List[str]) -> list:
    """
    Build the `content` array for the user message, combining:
    - the instruction text
    - any attached PDFs as `input_file`
    """
    # Base instruction text Joogni will see
    combined_instruction = (
        "You are Joogni, a California family-law drafting assistant. "
        "When PDFs are attached as input_file, you MUST read them carefully "
        "and incorporate their contents into your answer.\n\n"
        f"Task: {task}\n"
        f"User message: {user_message}"
    )

    content = [
        {
            "type": "input_text",
            "text": combined_instruction,
        }
    ]

    # Add each attached PDF as input_file
    for blob_name in file_blob_names:
        url = generate_blob_read_sas(blob_name)
        content.append(
            {
                "type": "input_file",
                "file_url": {
                    "url": url
                },
            }
        )

    return content


def run_openai_job(task: str, message: str, files: List[FileRef]) -> dict:
    """
    Call Azure OpenAI GPT-4o with input_text + input_file parts.
    """
    blob_names = [f.blob_name for f in files]

    user_content = build_message_content(task, message, blob_names)

    messages = [
        {
            "role": "system",
            "content": (
                "You are Joogni, a precise and practical assistant for a California family-law attorney. "
                "Be concise but clear. If you rely on an attached document, treat it as the source of truth."
            ),
        },
        {
            "role": "user",
            "content": user_content,
        },
    ]

    logger.info("Calling Azure OpenAI for task '%s' with %d file(s)", task, len(blob_names))

    completion = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=messages,
    )

    choice = completion.choices[0].message

    # Turn it into a plain dict for easier JSON storage
    return {
        "role": choice.role,
        "content": choice.content,
    }


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload-url", response_model=UploadUrlResponse)
def get_upload_url(req: UploadUrlRequest):
    """
    Frontend calls this to get a URL to upload the raw PDF directly to Blob.
    """
    unique = uuid.uuid4()
    blob_name = f"{unique}_{req.filename}"
    logger.info("Generating upload URL for: %s", blob_name)

    try:
        upload_url = generate_blob_write_sas(blob_name)
    except Exception as e:
        logger.exception("Failed to generate upload URL")
        raise HTTPException(status_code=500, detail=f"Could not generate upload URL: {e}")

    logger.info("Generated upload URL successfully for blob: %s", blob_name)
    return UploadUrlResponse(blob_name=blob_name, upload_url=upload_url)


@app.post("/jobs", response_model=JobResponse)
def create_job(req: CreateJobRequest):
    """
    Main endpoint the frontend calls when the user hits 'Send' in Joogni.

    It:
      - Creates a job id,
      - Calls Azure OpenAI with any attached files,
      - Saves the result JSON to Blob,
      - Returns the job id + result to the frontend.
    """
    job_id = str(uuid.uuid4())
    logger.info(
        "Created job: %s with %d files",
        job_id,
        len(req.files) if req.files else 0,
    )

    try:
        result = run_openai_job(req.task, req.message, req.files)
        save_result_to_blob(job_id, result)
    except HTTPException:
        # just re-raise API errors
        raise
    except Exception as e:
        logger.exception("Error running job %s", job_id)
        raise HTTPException(status_code=500, detail=str(e))

    return JobResponse(job_id=job_id, result=result)
