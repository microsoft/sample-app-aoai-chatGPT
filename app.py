from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    logger.info("+++ APP STARTUP +++")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("--- APP SHUTDOWN ---")


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


@app.post("/api/copilot")
async def copilot(request: Request):
    payload = await request.json()
    logger.info("Received copilot payload: %r", payload)

    # Try to grab the last user message
    user_message = "No user message found."
    try:
        msgs = payload.get("messages") or []
        for m in reversed(msgs):
            if m.get("role") == "user":
                user_message = m.get("content") or user_message
                break
    except Exception:
        pass

    answer = f"You asked: '{user_message}'. This is a dummy backend response from /api/copilot."

    response_body = {
        "answer": answer
    }

    logger.info("Returning copilot response: %r", response_body)
    return JSONResponse(status_code=200, content=response_body)
