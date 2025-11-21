import os
import uuid
import logging
import sys
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

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

# --- Routes ---

@app.get("/")
async def root():
    return {"status": "Online", "message": "Server is running in Lazy Mode"}

@app.post("/api/copilot")
async def start_copilot_job(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        job_id = str(uuid.uuid4())
        
        # We define the job wrapper here to ensure the endpoint returns immediately
        background_tasks.add_task(lazy_copilot_task, job_id, data)
        
        return {"job_id": job_id}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- The Lazy Task ---
# This imports libraries ONLY when the job runs. If they fail, it logs the error to the chat.

JOBS = {}

async def lazy_copilot_task(job_id: str, data: dict):
    JOBS[job_id] = {"status": "Processing", "result": ""}
    try:
        # 1. LAZY IMPORT - If these fail, we catch it here.
        try:
            from openai import AzureOpenAI
            from azure.core.credentials import AzureKeyCredential
            from azure.ai.documentintelligence import DocumentIntelligenceClient
            from azure.storage.blob import BlobServiceClient
        except ImportError as e:
            raise ImportError(f"Library Installation Failed: {e}")

        # 2. CHECK KEYS
        key = os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        if not key or not endpoint:
            raise ValueError("Missing Azure OpenAI Key/Endpoint in Environment Variables.")

        # 3. RUN LOGIC (Simplified for diagnosis)
        client = AzureOpenAI(api_key=key, azure_endpoint=endpoint, api_version="2024-02-01")
        
        task = data.get("task", "general")
        user_msg = data.get("messages", [])[-1].get("content", "")
        
        completion = client.chat.completions.create(
            model="model-router",
            messages=[
                {"role": "system", "content": f"You are a helpful AI. Task: {task}"},
                {"role": "user", "content": user_msg}
            ]
        )
        
        JOBS[job_id]["status"] = "Complete"
        JOBS[job_id]["result"] = completion.choices[0].message.content

    except Exception as e:
        logger.error(f"Job Failed: {e}")
        JOBS[job_id]["status"] = "Failed"
        JOBS[job_id]["result"] = f"CRITICAL ERROR: {str(e)}"

@app.get("/api/check_status/{job_id}")
async def check_job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return {"status": job["status"], "result": job["result"]}
