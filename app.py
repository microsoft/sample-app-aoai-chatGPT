import json
import os
import logging
from fastapi import FastAPI, Request, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.chat import chat, chat_stream
from backend.models import ChatRequest
from backend.utils import (
    format_non_streaming_response,
    format_stream_response,
    get_http_auth,
    http_auth_header,
    parse_multi_form_request,
)
from backend.settings import app_settings

# Debug settings
DEBUG = os.environ.get("DEBUG", "false")
if DEBUG.lower() == "true":
    logging.basicConfig(level=logging.DEBUG)


# This is the line that was missing and causing the 'Failed to find attribute' error
app = FastAPI(
    title="Sample Chat App",
    description="A sample chat app using Azure OpenAI and Cognitive Search.",
)


# This is the mount for your UI files (index.html, script.js, style.css)
# We point /static to the new /static/ui directory
app.mount("/static", StaticFiles(directory="static/ui"), name="static_ui")


# This serves your index.html from the root
@app.get("/")
async def index(request: Request):
    return FileResponse("static/ui/index.html", media_type="text/html")

# This serves your script.js
@app.get("/script.js")
async def script():
    return FileResponse("static/ui/script.js", media_type="application/javascript")

# This serves your style.css
@app.get("/style.css")
async def style():
    return FileResponse("static/ui/style.css", media_type="text/css")


# This is our fix for the AttributeError
if getattr(app_settings.chat_history, 'enabled', False):
    try:
        from backend.history import history_router
        app.include_router(history_router, prefix="/history", tags=["History"])
    except ImportError:
        logging.warning("History module not found, /history routes will be unavailable.")


# This is the main chat API route your script.js calls
@app.post("/chat")
async def chat_handler(
    req: Request,
    chat_request: ChatRequest,
    auth: str = Depends(get_http_auth),
):
    headers = http_auth_header(auth)
    return format_non_streaming_response(await chat(headers, chat_request))


# This is the streaming route (even if you don't use it, it's part of the original app)
@app.post("/chat-stream")
async def chat_stream_handler(
    req: Request,
    chat_request: ChatRequest,
    auth: str = Depends(get_http_auth),
):
    headers = http_auth_header(auth)
    return format_stream_response(await chat_stream(headers, chat_request))
