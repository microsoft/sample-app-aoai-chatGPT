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
    Extremely forgiving job endpoint:
    - Accepts ANY JSON body
    - Never assumes any particular structure
    - Always returns 200 with a completed job payload
    """
    try:
        payload = await request.json()
    except Exception:
        payload = None

    logger.info("Received job payload: %r", payload)

    # Dummy job id & response the platform can accept
    job_id = f"job-{uuid4()}"

    response_body = {
        "job_id": job_id,
        "status": "completed",
        "output": {
            "echo": payload,
            "message": "Job handled by backend.",
        },
    }

    logger.info("Returning job response: %r", response_body)

    return JSONResponse(status_code=200, content=response_body)
