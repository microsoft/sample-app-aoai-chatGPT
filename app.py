import uuid
import logging
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Logging config
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Joogni Backend - Ultra Lenient /jobs")


# CORS: allow everything so the frontend can talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # you can restrict this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """
    Simple health endpoint so the platform can see the app is alive.
    """
    return {"status": "ok"}


@app.post("/jobs")
async def create_job(request: Request) -> Dict[str, Any]:
    """
    ULTRA-LENIENT /jobs endpoint:

    - Accepts ANY JSON body (or none).
    - Never talks to Azure OpenAI.
    - Always returns a 'job' with:
        { job_id, status, result: { message, echo } }
    - Logs whatever the frontend sent so we can inspect it in the container logs.
    """
    try:
        body: Optional[Dict[str, Any]] = await request.json()
    except Exception:
        body = None

    logger.info("----- /jobs called -----")
    logger.info(f"Request body: {body}")

    job_id = str(uuid.uuid4())

    # Very generic response that most “job” clients will tolerate
    return {
        "job_id": job_id,
        "status": "completed",
        "result": {
            "message": "👋 Hello from the ultra-lenient backend. The job completed successfully.",
            "echo": body,
        },
        "metadata": {},
    }


@app.get("/")
async def root():
    """
    Root endpoint just to verify the app is running.
    """
    return {"message": "Backend is running", "hint": "POST to /jobs to start a job."}
