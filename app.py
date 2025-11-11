# app.py — Quart backend for SWA chat (strict CORS, Azure OpenAI, SAS uploads)

import os
import uuid
import logging
import datetime
import asyncio
from typing import Optional

from quart import Quart, jsonify, request, redirect, Response
from quart_cors import cors

# Azure OpenAI (Projects)
from openai import AzureOpenAI

# Azure Storage (used by /api/get-upload-url)
from azure.storage.blob import generate_blob_sas, BlobSasPermissions


# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

FRONTEND_ORIGIN = (
    os.getenv("ALLOWED_ORIGINS", "").split(",")[0].strip()
    or os.getenv("FRONTEND_ORIGIN", "")
    or "https://<your-swa>.azurestaticapps.net"
)

BACKEND_PUBLIC_URL = (os.getenv("BACKEND_PUBLIC_URL", "").strip()
                      or "https://pb25.azurewebsites.net")

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY") or (
    "dev_only_do_not_use_in_prod" if DEBUG else None
)
if not SESSION_SECRET_KEY:
    raise RuntimeError("SESSION_SECRET_KEY must be set in production")

# Azure OpenAI config (Azure AI Foundry Projects)
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_MODEL = os.getenv("AZURE_OPENAI_MODEL")
AZURE_OPENAI_PROJECT = os.getenv("AZURE_OPENAI_PROJECT")  # recommended
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION", "2024-10-21")  # works with input_file

# Frontend settings returned to your SWA
FRONTEND_SETTINGS = {
    "auth_enabled": True,
    "feedback_enabled": False,
    "oyd_enabled": "none",
    "sanitize_answer": False,
    "ui": {
        "title": os.getenv("UI_TITLE", "PB25 AI"),
        "logo": None,
        "chat_logo": None,
        "chat_title": os.getenv("UI_CHAT_TITLE", "Start chatting"),
        "chat_description": os.getenv(
            "UI_CHAT_DESC", "You can ask questions or attach files for analysis."
        ),
        "show_share_button": True,
        "show_chat_history_button": True,
    },
    # important bits the frontend reads
    "frontend_origin": FRONTEND_ORIGIN,
    "backend_origin": BACKEND_PUBLIC_URL,
    "provider": "azure_openai",
    "model": AZURE_OPENAI_MODEL,
    "api_version": OPENAI_API_VERSION,
}


# ──────────────────────────────────────────────────────────────
# APP FACTORY
# ──────────────────────────────────────────────────────────────
def create_app():
    app = Quart(__name__)
    app.secret_key = SESSION_SECRET_KEY

    # Strict CORS for SWA
    app = cors(
        app,
        allow_origin=[FRONTEND_ORIGIN],
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        allow_credentials=True,
    )

    # Cross-site cookies (SWA domain)
    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE=True,
    )

    # Initialize Azure OpenAI client (Projects)
    client: Optional[AzureOpenAI] = None
    if AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY and AZURE_OPENAI_MODEL:
        # If you have multiple Projects under one account, set AZURE_OPENAI_PROJECT
        default_headers = {}
        if AZURE_OPENAI_PROJECT:
            default_headers["x-ms-azureai-project-name"] = AZURE_OPENAI_PROJECT

        client = AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_OPENAI_KEY,
            api_version=OPENAI_API_VERSION,
            default_headers=default_headers or None,
        )
    else:
        logging.warning("Azure OpenAI env vars missing; /conversation will echo.")

    # ───────── Health check ─────────
    @app.get("/healthz")
    async def healthz():
        return {"status": "ok"}

    # ───────── Root redirect to SWA ─────────
    @app.get("/")
    async def root():
        fe = (FRONTEND_ORIGIN or "").strip()
        if not fe or "<your-swa>" in fe:
            return (
                "<h3>Backend is running.</h3>"
                "<p>FRONTEND_ORIGIN is not configured.</p>"
                "<p>Set <code>FRONTEND_ORIGIN</code> to your SWA URL "
                "(e.g., https://white-stone-09b65ea1e.3.azurestaticapps.net) and restart.</p>",
                200,
                {"Content-Type": "text/html"},
            )
        return redirect(fe, 302)

    # ───────── Auth stubs (UI-ready) ─────────
    @app.get("/auth/status")
    async def auth_status():
        return jsonify({"isAuthenticated": True, "user": {"name": "Demo User"}})

    @app.get("/auth/login")
    async def auth_login():
        return redirect(FRONTEND_ORIGIN)

    @app.get("/auth/logout")
    async def auth_logout():
        return redirect(FRONTEND_ORIGIN)

    # ───────── Settings for the frontend ─────────
    @app.get("/frontend_settings")
    async def get_frontend_settings():
        # Always return fresh env-backed values (helpful during config changes)
        fs = dict(FRONTEND_SETTINGS)
        fs["frontend_origin"] = (os.getenv("FRONTEND_ORIGIN") or FRONTEND_ORIGIN).strip()
        fs["backend_origin"] = (os.getenv("BACKEND_PUBLIC_URL") or BACKEND_PUBLIC_URL).strip()
        fs["model"] = os.getenv("AZURE_OPENAI_MODEL") or AZURE_OPENAI_MODEL
        fs["api_version"] = os.getenv("OPENAI_API_VERSION") or OPENAI_API_VERSION
        return jsonify(fs), 200

    # ───────── Conversation (non-streaming) ─────────
    @app.post("/conversation")
    async def conversation():
        """
        Non-streaming chat endpoint that ALWAYS returns a string in
        choices[0].message.content so the UI never shows '(no content)'.
        Falls back to echo if Azure OpenAI isn't configured.
        """
        if not request.is_json:
            return jsonify({"error": "request must be json"}), 415

        try:
            data = await request.get_json()
        except Exception as e:
            return jsonify({"error": "invalid_json", "detail": str(e)}), 400

        messages = data.get("messages") or []
        if not isinstance(messages, list) or not messages:
            return jsonify({"error": "messages array required"}), 400

        # If client not configured, echo last user so UI still works
        if not client:
            last_user = next(
                (m.get("content") for m in reversed(messages) if m.get("role") == "user"),
                "",
            )
            text = f"(Echo) You said: {last_user}" if last_user else "Hello! Backend is connected."
            return jsonify({
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": text},
                    "finish_reason": "stop",
                }],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            }), 200

        # Azure OpenAI call in a worker thread
        try:
            def _call():
                return client.chat.completions.create(
                    model=AZURE_OPENAI_MODEL,
                    messages=messages,
                )
            resp = await asyncio.to_thread(_call)
        except Exception as e:
            logging.exception("chat_failed")
            return jsonify({"error": "chat_failed", "detail": str(e)}), 500

        # ---- Normalize response to guaranteed string content ----
        choice = (getattr(resp, "choices", None) or [None])[0]
        finish = getattr(choice, "finish_reason", None) or "stop"
        content = ""

        try:
            msg = getattr(choice, "message", None)
            if msg:
                content = (getattr(msg, "content", None) or "").strip()
                if not content:
                    refusal = getattr(msg, "refusal", None)
                    if refusal:
                        content = refusal
                    elif getattr(msg, "tool_calls", None):
                        content = "I considered using tools, but this backend doesn’t support tools yet."
            if not content and getattr(choice, "text", None):
                content = choice.text
        except Exception:
            content = ""

        if not content:
            content = "(no text returned by the model)"

        out = {
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": finish,
            }]
        }
        try:
            if getattr(resp, "usage", None):
                out["usage"] = resp.usage.model_dump()
        except Exception:
            pass

        return jsonify(out), 200

    # ───────── Optional: streaming (plain text stream of deltas) ─────────
    @app.post("/conversation_stream")
    async def conversation_stream():
        if not request.is_json:
            return jsonify({"error": "request must be json"}), 415
        if not client:
            return jsonify({"error": "stream_unavailable", "detail": "Model not configured"}), 501

        data = await request.get_json()
        messages = data.get("messages") or []
        if not isinstance(messages, list) or not messages:
            return jsonify({"error": "messages array required"}), 400

        async def gen():
            try:
                def _stream():
                    return client.chat.completions.create(
                        model=AZURE_OPENAI_MODEL,
                        messages=messages,
                        stream=True,
                    )
                stream = await asyncio.to_thread(_stream)
                for event in stream:
                    delta = event.choices[0].delta.content or ""
                    if delta:
                        yield delta
                yield "\n"
            except Exception as e:
                logging.exception("stream_failed")
                yield f"\n[stream_error] {e}\n"

        return Response(gen(), content_type="text/plain")

    # ───────── Summarize File (PDF/DOCX/Images via file URL) ─────────
    @app.post("/summarize_file")
    async def summarize_file():
        """
        Summarizes an uploaded file using Azure OpenAI.
        Expects JSON: { "url": "<SAS READ URL>", "question": "Summarize ..." }
        """
        if not request.is_json:
            return jsonify({"error": "request must be json"}), 415
        if not client:
            return jsonify({"error": "model_not_configured"}), 500

        try:
            data = await request.get_json()
        except Exception as e:
            return jsonify({"error": "invalid_json", "detail": str(e)}), 400

        file_url = (data or {}).get("url")
        question = (data or {}).get("question") or "Summarize the attached document."
        if not file_url:
            return jsonify({"error": "missing_url"}), 400

        try:
            def _call():
                # ✅ FIXED: use "file" instead of "input_file"
                return client.chat.completions.create(
                    model=AZURE_OPENAI_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an AI legal assistant. Read the attached file and answer clearly, "
                                "concisely, and accurately for attorneys."
                            ),
                        },
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": f"{question}\n\nPlease read and summarize this file:"},
                                {"type": "file", "file_url": file_url},
                            ],
                        },
                    ],
                    temperature=0.2,
                )

            resp = await asyncio.to_thread(_call)
            content = resp.choices[0].message.content or "(no summary)"
            return jsonify({"summary": content}), 200

        except Exception as e:
            logging.exception("summarize_failed")
            return jsonify({"error": "summarize_failed", "detail": str(e)}), 500

    # ───────── Upload SAS helper ─────────
    def _parse_conn_str(cs: str):
        parts = dict(kv.split("=", 1) for kv in cs.split(";") if "=" in kv)
        return parts.get("AccountName"), parts.get("AccountKey")

    @app.post("/api/get-upload-url")
    async def get_upload_url():
        """
        Returns a short-lived SAS URL to PUT a file into container 'chatuploads'.
        Also returns a readable SAS URL (readUrl) so the model can fetch it.
        Requires AZURE_STORAGE_CONNECTION_STRING in App Settings.
        """
        if not request.is_json:
            return jsonify({"error": "request must be json"}), 415

        payload = await request.get_json()
        file_name = (payload or {}).get("fileName") or f"upload-{uuid.uuid4()}.bin"

        conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not conn:
            return jsonify({"error": "AZURE_STORAGE_CONNECTION_STRING not configured"}), 500

        acct, key = _parse_conn_str(conn)
        if not (acct and key):
            return jsonify({"error": "Invalid storage connection string"}), 500

        container = "chatuploads"
        expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)

        # IMPORTANT: allow read so the model can download the file
        sas = generate_blob_sas(
            account_name=acct,
            container_name=container,
            blob_name=file_name,
            account_key=key,
            permission=BlobSasPermissions(create=True, write=True, read=True),
            expiry=expiry,
        )
        base = f"https://{acct}.blob.core.windows.net"
        sas_url = f"{base}/{container}/{file_name}?{sas}"

        return jsonify(
            {
                "sasUrl": sas_url,                         # PUT here to upload
                "blobUrl": f"{base}/{container}/{file_name}",  # permanent URL (no SAS)
                "readUrl": sas_url,                        # READ with same SAS (model can fetch)
            }
        )

    return app


# ──────────────────────────────────────────────────────────────
# APP INSTANCE
# ──────────────────────────────────────────────────────────────
app = create_app()
