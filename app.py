import os
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    BackgroundTasks,
    HTTPException,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from azure.storage.blob import BlobServiceClient
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient

# -------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------
LOGLEVEL = os.getenv("LOGLEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOGLEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("app")

# -------------------------------------------------------------------
# CORS / Origins
# -------------------------------------------------------------------
# Prefer ALLOWED_ORIGINS (comma-separated), then FRONTEND_ORIGIN, else "*"
allowed_origins_env = os.getenv("ALLOWED_ORIGINS") or os.getenv("FRONTEND_ORIGIN")
if allowed_origins_env:
    ALLOWED_ORIGINS = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    ALLOWED_ORIGINS = ["*"]

# -------------------------------------------------------------------
# Storage & containers (connection string usually lives in App Service
# "Connection strings" section; name it AZURE_STORAGE_CONNECTION_STRING)
# -------------------------------------------------------------------
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
if not AZURE_STORAGE_CONNECTION_STRING:
    raise RuntimeError("AZURE_STORAGE_CONNECTION_STRING is required")

UPLOAD_CONTAINER = os.getenv("UPLOAD_CONTAINER", "chatuploads")
JOBSTATUS_CONTAINER = os.getenv("JOBSTATUS_CONTAINER", "jobstatus")

blob_service_client = BlobServiceClient.from_connection_string(
    AZURE_STORAGE_CONNECTION_STRING
)
upload_container_client = blob_service_client.get_container_client(UPLOAD_CONTAINER)
jobstatus_container_client = blob_service_client.get_container_client(JOBSTATUS_CONTAINER)

for c in (upload_container_client, jobstatus_container_client):
    try:
        c.create_container()
    except Exception:
        # Already exists
        pass

# -------------------------------------------------------------------
# Azure Document Intelligence
# -------------------------------------------------------------------
DOCINT_ENDPOINT = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
DOCINT_KEY = os.getenv("DOCUMENTINTELLIGENCE_KEY")
DOCINT_MODEL_ID = os.getenv("DOCUMENTINTELLIGENCE_MODEL_ID", "prebuilt-document")

docint_client: Optional[DocumentIntelligenceClient] = None
if DOCINT_ENDPOINT and DOCINT_KEY:
    docint_client = DocumentIntelligenceClient(
        endpoint=DOCINT_ENDPOINT,
        credential=AzureKeyCredential(DOCINT_KEY),
    )
else:
    logger.warning(
        "Document Intelligence not fully configured; OCR will return empty text."
    )

# -------------------------------------------------------------------
# Azure OpenAI (works with standard env naming)
#   Required (for Azure OpenAI):
#     AZURE_OPENAI_ENDPOINT
#     AZURE_OPENAI_API_KEY
#   Optional:
#     OPENAI_API_VERSION  (you already have this)
# -------------------------------------------------------------------
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_DEPLOYMENT_ID = os.getenv("AZURE_OPENAI_DEPLOYMENT_ID")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION", "2024-02-15-preview")

if not (AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY and AZURE_OPENAI_DEPLOYMENT_ID):
    logger.warning(
        "Azure OpenAI endpoint/key/deployment not fully configured; "
        "draft generation will return a placeholder string."
    )

# -------------------------------------------------------------------
# FastAPI app
# -------------------------------------------------------------------
app = FastAPI(title="BossNex Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Pydantic models
# -------------------------------------------------------------------


class CreateJobRequest(BaseModel):
    files: List[str]  # blob names in `chatuploads`
    prompt: str
    extra_context: Optional[str] = None


class JobStatus(BaseModel):
    job_id: str
    status: str  # queued | running | succeeded | failed
    created_at: str
    updated_at: str
    files: List[str]
    prompt: str
    error: Optional[str] = None
    draft: Optional[str] = None
    metadata: Optional[dict] = None


# -------------------------------------------------------------------
# Helpers – Blob Storage
# -------------------------------------------------------------------
def _save_job_status(job: JobStatus) -> None:
    """Persist job status as JSON in jobstatus container."""
    blob_name = f"{job.job_id}.json"
    payload = job.model_dump()
    jobstatus_container_client.upload_blob(
        name=blob_name,
        data=json.dumps(payload, ensure_ascii=False, indent=2),
        overwrite=True,
    )
    logger.info("Saved job status for %s (status=%s)", job.job_id, job.status)


def _load_job_status(job_id: str) -> JobStatus:
    blob_name = f"{job_id}.json"
    try:
        blob = jobstatus_container_client.get_blob_client(blob_name)
        stream = blob.download_blob()
        data = json.loads(stream.readall())
        return JobStatus(**data)
    except Exception as e:
        logger.error("Error loading job %s: %s", job_id, e)
        raise HTTPException(status_code=404, detail="Job not found")


def _download_blob_to_bytes(blob_name: str) -> bytes:
    try:
        blob_client = upload_container_client.get_blob_client(blob_name)
        stream = blob_client.download_blob()
        data = stream.readall()
        logger.info("Downloaded blob %s (%d bytes)", blob_name, len(data))
        return data
    except Exception as e:
        logger.error("Error downloading blob %s: %s", blob_name, e)
        raise


# -------------------------------------------------------------------
# Helpers – Document Intelligence & Azure OpenAI
# -------------------------------------------------------------------
def _extract_text_with_docint(file_bytes: bytes) -> str:
    """
    Send PDF bytes to Azure Document Intelligence and return extracted text.

    NOTE: This uses the correct signature:
      begin_analyze_document(model_id, body, content_type=...)
    which fixes the error:
      DocumentIntelligenceClientOperationsMixin.begin_analyze_document()
      missing 1 required positional argument: 'body'
    """
    if not docint_client:
        return ""

    try:
        poller = docint_client.begin_analyze_document(
            model_id=DOCINT_MODEL_ID,
            body=file_bytes,               # <-- THIS IS THE REQUIRED 'body'
            content_type="application/pdf",
        )
        result = poller.result()

        texts: List[str] = []

        # Newer SDK often exposes overall combined content
        if getattr(result, "content", None):
            texts.append(result.content)

        # Also loop through pages if present
        if getattr(result, "pages", None):
            for page in result.pages:
                if getattr(page, "content", None):
                    texts.append(page.content)

        full_text = "\n".join(t for t in texts if t)
        logger.info("Extracted %d characters from Document Intelligence", len(full_text))
        return full_text
    except Exception as e:
        logger.error("Document Intelligence error: %s", e)
        return ""


async def _call_azure_openai(prompt: str, context: str) -> str:
    """Call Azure OpenAI Chat Completions and return the draft text."""
    if not (AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY and AZURE_OPENAI_DEPLOYMENT_ID):
        logger.warning("Azure OpenAI not configured; returning placeholder draft.")
        return (
            "Azure OpenAI is not configured in the backend, "
            "so this is a placeholder draft instead of a real model response."
        )

    url = (
        f"{AZURE_OPENAI_ENDPOINT}/openai/deployments/"
        f"{AZURE_OPENAI_DEPLOYMENT_ID}/chat/completions"
        f"?api-version={OPENAI_API_VERSION}"
    )

    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY,
    }

    system_prompt = (
        "You are an expert California family law assistant. "
        "You receive OCR'd text from court filings, declarations, custody reports, "
        "and related documents. Draft clear, practical, and well-structured output. "
        "Cite and summarize rather than copying huge chunks verbatim."
    )

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    f"User prompt:\n{prompt}\n\n"
                    f"Relevant extracted document text:\n{context[:50000]}"
                ),
            },
        ],
        "temperature": 0.25,
        "top_p": 0.95,
        "max_tokens": 4096,
        "stream": os.getenv("SHOULD_STREAM", "false").lower() == "true",
    }

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code != 200:
            logger.error(
                "Azure OpenAI error %s: %s",
                resp.status_code,
                resp.text[:800],
            )
            raise RuntimeError(f"Azure OpenAI error: {resp.status_code}")

        data = resp.json()

        # If streaming was enabled, response shape may differ; handle both.
        try:
            if isinstance(data.get("choices"), list):
                draft = data["choices"][0]["message"]["content"]
            else:
                draft = json.dumps(data, indent=2)
        except Exception:
            draft = json.dumps(data, indent=2)

        logger.info("Received draft from Azure OpenAI (%d chars)", len(draft))
        return draft


# -------------------------------------------------------------------
# Job processor (background)
# -------------------------------------------------------------------
async def _process_job(job_id: str, payload: CreateJobRequest) -> None:
    logger.info("Processing job %s", job_id)

    job = _load_job_status(job_id)
    job.status = "running"
    job.updated_at = datetime.now(timezone.utc).isoformat()
    _save_job_status(job)

    try:
        # 1. Download & OCR all files
        all_text_chunks: List[str] = []

        for blob_name in payload.files:
            try:
                file_bytes = _download_blob_to_bytes(blob_name)
                text = _extract_text_with_docint(file_bytes)
                if text:
                    all_text_chunks.append(text)
            except Exception as e:
                logger.error("Error processing file %s: %s", blob_name, e)

        combined_context = "\n\n".join(all_text_chunks)
        if payload.extra_context:
            combined_context += "\n\nAdditional user-provided context:\n" + payload.extra_context

        # 2. Call Azure OpenAI to create draft
        draft = await _call_azure_openai(payload.prompt, combined_context)

        # 3. Save success status
        job.status = "succeeded"
        job.updated_at = datetime.now(timezone.utc).isoformat()
        job.draft = draft
        job.metadata = {
            "num_files": len(payload.files),
            "context_chars": len(combined_context),
        }
        _save_job_status(job)

        logger.info("Job %s completed successfully", job_id)

    except Exception as e:
        logger.exception("Job %s failed: %s", job_id, e)
        job.status = "failed"
        job.updated_at = datetime.now(timezone.utc).isoformat()
        job.error = str(e)
        _save_job_status(job)


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "time": datetime.now(timezone.utc).isoformat(),
        "allowed_origins": ALLOWED_ORIGINS,
    }


@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload one or more files to Blob Storage (container: chatuploads).

    Returns an array of blob names you can pass into /jobs.
    """
    uploaded: List[str] = []

    for f in files:
        contents = await f.read()
        if not contents:
            continue

        blob_name = f"{uuid.uuid4()}-{f.filename}"
        blob_client = upload_container_client.get_blob_client(blob_name)
        blob_client.upload_blob(contents, overwrite=True)

        uploaded.append(blob_name)
        logger.info("Uploaded %s as blob %s", f.filename, blob_name)

    if not uploaded:
        raise HTTPException(status_code=400, detail="No valid files uploaded")

    return {"files": uploaded}


@app.post("/jobs", response_model=JobStatus)
async def create_job(request: CreateJobRequest, background_tasks: BackgroundTasks):
    """
    Create a new job based on existing blobs in `chatuploads`.

    Front end flow:
      1. POST /upload -> get blob names
      2. POST /jobs   -> pass those blob names + prompt
      3. Poll /jobs/{job_id} until status == 'succeeded' or 'failed'
    """
    if not request.files:
        raise HTTPException(status_code=400, detail="No files specified")

    now = datetime.now(timezone.utc).isoformat()
    job_id = str(uuid.uuid4())

    job = JobStatus(
        job_id=job_id,
        status="queued",
        created_at=now,
        updated_at=now,
        files=request.files,
        prompt=request.prompt,
    )
    _save_job_status(job)

    # Kick off async processing
    background_tasks.add_task(_process_job, job_id, request)

    return job


@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job(job_id: str):
    """Fetch status & result of a job."""
    return _load_job_status(job_id)
