import uuid
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------

class ChatFile(BaseModel):
    filename: str
    url: str


class CreateJobRequest(BaseModel):
    task: str
    message: str
    files: Optional[List[ChatFile]] = None


class JobResponse(BaseModel):
    job_id: str
    result: dict


# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------

app = FastAPI(title="Joogni Backend - Minimal Echo Version")


@app.get("/health")
def health_check():
    """
    Simple health endpoint so the platform can see the app is alive.
    """
    return {"status": "ok"}


@app.post("/jobs", response_model=JobResponse)
def create_job(req: CreateJobRequest):
    """
    Minimal /jobs endpoint that ALWAYS returns 200 and NEVER talks to Azure.

    This is purely to verify:
      - The frontend is calling the right URL (/jobs),
      - CORS / networking is OK,
      - The request body matches this schema,
      - The frontend correctly handles a successful response.
    """
    job_id = str(uuid.uuid4())

    # This is the "assistant" reply the frontend will show.
    # We keep it simple on purpose.
    assistant_message = {
        "role": "assistant",
        "content": (
            "👋 Hi from the minimal backend!\n\n"
            f"- task: {req.task}\n"
            f"- message: {req.message}\n"
            f"- files_received: {len(req.files) if req.files else 0}"
        ),
    }

    return JobResponse(job_id=job_id, result=assistant_message)
