import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import List

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
    raise RuntimeError("Azure OpenAI config missing.")

if not (STORAGE_CONNECTION_STRING or (STORAGE_ACCOUNT_NAME and STORAGE_ACCOUNT_KEY)):
    raise RuntimeError(
        "Azure Storage config missing. Provide CONNECTION_STRING or ACCOUNT + KEY."
    )

# -------------------------------------------------------------------
# Azure Blob setup
# -------------------------------------------------------------------
if STORAGE_CONNECTION_STRING:
    blob_service_client = BlobServiceClient.from_connection_string(
        STORAGE_CONNECTION_STRING
    )
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
    logger.info(f"Created container: {STORAGE_CONTAINER_NAME}")
except Exception:
    logger.info(f"Storage configured for container: {STORAGE_CONTAINER_NAME}")

# -------------------------------------------------------------------
# Azure OpenAI client
# -------------------------------------------------------------------
client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version="2024-08-01-preview",
)

# -------------------------------------------------------------------
# FastAPI setup
# -------------------------------------------------------------------
app = FastAPI(title="Joogni Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
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
# Helpers
# -------------------------------------------------------------------
def create_sas_url(blob_name: str, permission: BlobSasPermissions) -> str:
    sas_token = generate_blob_sas(
        account_name=account_name_for_sas,
        container_name=STORAGE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=STORAGE_ACCOUNT_KEY,
        permission=permission,
        expiry=datetime.utcnow() + timedelta(hours=1),
    )
    return (
        f"https://{account_name_for_sas}.blob.core.windows.net/"
        f"{STORAGE_CONTAINER_NAME}/{blob_name}?{sas_token}"
    )


def save_job_result(job_id: str, result: dict):
    blob_name = f"results/{job_id}.json"
    data = json.dumps(result, ensure_ascii=False).encode()
    container_client.upload_blob(blob_name, data, overwrite=True)
    logger.info(f"Saved result for job: {job_id}")


def build_message(task: str, text: str, file_blob_names: List[str]):
    """Builds message for GPT with input_text and input_file parts."""
    content = [
        {
            "type": "input_text",
            "text": (
                "You are Joogni, a California family-law drafting assistant. "
                "When PDFs are attached via input_file, READ THEM and incorporate into responses.\n\n"
                f"Task: {task}\n"
                f"User message: {text}"
            ),
        }
    ]

    for blob in file_blob_names:
        file_url = create_sas_url(blob, BlobSasPermissions(read=True))
        content.append({
            "type": "input_file",
            "file_url": {"url": file_url},
        })

    return [
        {
            "role": "system",
            "content": (
                "You are Joogni, assistant to a California family law attorney. "
                "Always be concise, accurate, and incorporate attached PDFs when present."
            ),
        },
        {"role": "user", "content": content},
    ]


def run_gpt(task: str, message: str, files: List[FileRef]):
    blob_names = [f.blob_name for f in files]
    messages = build_message(task, message, blob_names)

    logger.info(f"Calling Azure OpenAI with {len(blob_names)} file(s).")

    completion = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=messages,
    )

    msg = completion.choices[0].message
    return {"role": msg.role, "content": msg.content}


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload-url", response_model=UploadUrlResponse)
def upload_url(req: UploadUrlRequest):
    """Generates SAS URL for direct browser upload."""
    blob_name = f"{uuid.uuid4()}_{req.filename}"
    url = create_sas_url(blob_name, BlobSasPermissions(write=True, create=True))
    logger.info(f"Generated upload URL for: {blob_name}")
    return UploadUrlResponse(blob_name=blob_name, upload_url=url)


@app.post("/jobs", response_model=JobResponse)
def create_job(req: CreateJobRequest):
    job_id = str(uuid.uuid4())
    logger.info(f"Created job {job_id} with {len(req.files)} files")

    try:
        result = run_gpt(req.task, req.message, req.files)
        save_job_result(job_id, result)
    except Exception as e:
        logger.exception(f"Job {job_id} failed")
        raise HTTPException(status_code=500, detail=str(e))

    return JobResponse(job_id=job_id, result=result)


# -------------------------------------------------------------------
# IMPORTANT: Frontend alias
# -------------------------------------------------------------------
@app.post("/api/copilot", response_model=JobResponse)
def copilot(req: CreateJobRequest):
    """Frontend compatibility: /api/copilot → /jobs"""
    return create_job(req)
