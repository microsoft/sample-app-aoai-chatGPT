import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# --- Logging setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    logger.info("+++ APP STARTUP +++")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("--- APP SHUTDOWN ---")


# Log every request so we can see what the platform is calling
@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        body_bytes = await request.body()
        body_preview = body_bytes.decode("utf-8", errors="ignore")[:500]
    except Exception:
        body_preview = "<unable to read body>"

    logger.info("Incoming %s %s | body: %s", request.method, request.url.path, body_preview)

    response = await call_next(request)

    logger.info(
        "Completed %s %s -> %s",
        request.method,
        request.url.path,
        response.status_code,
    )
    return response


@app.get("/")
async def root():
    return {"message": "Backend is running"}


@app.get("/health")
async def health():
    # Simple health endpoint the platform can ping
    return {"status": "ok"}


@app.post("/jobs")
async def create_job(request: Request):
    """
    Extremely forgiving job endpoint (kept just in case anything uses it).
    """
    try:
        payload = await request.json()
    except Exception:
        payload = None

    logger.info("Received job payload on /jobs: %r", payload)

    job_id = f"job-{uuid4()}"

    response_body = {
        "job_id": job_id,
        "status": "completed",
        "output": {
            "echo": payload,
            "message": "Job handled by /jobs backend.",
        },
    }

    logger.info("Returning job response from /jobs: %r", response_body)

    return JSONResponse(status_code=200, content=response_body)


@app.post("/api/copilot")
async def copilot(request: Request):
    """
    This is the endpoint your app is actually calling:
    body: {"jurisdiction": "...", "task": "...", "messages": [...], "blobs": []}

    We:
    - accept ANY JSON
    - log it
    - always return 200 with a simple 'answer' + echo
    """
    try:
        data = await request.json()
    except Exception:
        data = None

    logger.info("Received copilot payload: %r", data)

    # Try to extract the latest user question (best effort, safe if shape changes)
    user_question = None
    if isinstance(data, dict):
        msgs = data.get("messages") or []
        if isinstance(msgs, list) and msgs:
            last = msgs[-1]
            if isinstance(last, dict):
                user_question = last.get("content")

    # Very simple placeholder answer — we can later swap this for real OpenAI logic
    if user_question:
        answer_text = f"You asked: {user_question!r}. This is a dummy backend response from /api/copilot."
    else:
        answer_text = "This is a dummy backend response from /api/copilot."

    response_body = {
        "status": "completed",
        "answer": answer_text,
        "echo": data,
    }

    logger.info("Returning copilot response: %r", response_body)

    return JSONResponse(status_code=200, content=response_body)
