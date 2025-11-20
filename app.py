from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.info("+++ APP STARTUP +++")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        body_bytes = await request.body()
        body_preview = body_bytes.decode("utf-8", errors="ignore")[:500]
    except Exception:
        body_preview = "<unable to read body>"
    
    logger.info("Incoming %s %s | body: %s", request.method, request.url.path, body_preview)
    response = await call_next(request)
    logger.info("Completed %s %s -> %s", request.method, request.url.path, response.status_code)
    return response

@app.get("/")
async def root():
    return {"message": "Backend is running"}

# --- Mocking the Async Job Flow for the Smoke Test ---

@app.post("/api/copilot")
async def copilot(request: Request):
    """
    Mocks the job creation. Returns a static job_id to satisfy script.js.
    """
    payload = await request.json()
    logger.info("Received copilot payload: %r", payload)
    
    # Return a dummy job_id so script.js proceeds to polling
    return JSONResponse(status_code=200, content={"job_id": "smoke-test-123"})

@app.get("/api/check_status/{job_id}")
async def check_status(job_id: str):
    """
    Mocks the status check. Returns 'Complete' immediately.
    """
    logger.info(f"Checking status for job: {job_id}")
    
    return JSONResponse(status_code=200, content={
        "status": "Complete",
        "result": "Ghost Busted! 👻 The backend is successfully updated and communicating with the frontend."
    })
