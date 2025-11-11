# app.py — Quart backend for PB25 AI (Azure OpenAI + SAS upload + summarization)

import os
import uuid
import logging
import datetime
import asyncio
from typing import Optional

from quart import Quart, jsonify, request, redirect, Response
from quart_cors import cors
from openai import AzureOpenAI
from azure.storage.blob import generate_blob_sas, BlobSasPermissions

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

FRONTEND_ORIGIN = (
    os.getenv("FRONTEND_ORIGIN")
    or "https://white-stone-09b65ea1e.3.azurestaticapps.net"
)
BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL") or "https://pb25.azurewebsites.net"

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY") or (
    "dev_only_do_not_use_in_prod" if DEBUG else None
)
if not SESSION_SECRET_KEY:
    raise RuntimeError("SESSION_SECRET_KEY must be set in production")

# Azure OpenAI config
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_MODEL = os.getenv("AZURE_OPENAI_MODEL", "gpt-4o")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION", "2024-05-01-preview")

# ──────────────────────────────────────────────
# FRONTEND SETTINGS
# ──────────────────────────────────────────────
FRONTEND_SETTINGS = {
    "auth_enabled": True,
    "feedback_enabled": False,
    "sanitize_answer": False,
    "ui": {
        "title": "PB25 AI",
        "chat_title": "PB25 AI",
        "chat_description": "Ask questions or upload a file for summarization.",
        "show_share_button": True,
    },
    "frontend_origin": FRONTEND_ORIGIN,
    "backend_origin": BACKEND_PUBLIC_URL,
    "provider": "azure_openai",
    "model": AZURE_OPENAI_MODEL,
    "api_version": OPENAI_API_VERSION,
}

# ──────────────────────────────────────────────
# APP FACTORY
# ──────────────────────────────────────────────
def create_app():
    app = Quart(__name__)
    app.secret_key = SESSION_SECRET_KEY
    app = cors(
        app,
        allow_origin=[FRONTEND_ORIGIN],
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        allow_credentials=True,
    )

    client: Optional[AzureOpenAI] = None
    if AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY:
        client = AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_OPENAI_KEY,
            api_version=OPENAI_API_VERSION,
        )
    else:
        logging.warning("Azure OpenAI env vars missing — using echo mode.")

    # ───────── Health check ─────────
    @app.get("/healthz")
    async def healthz():
        return {"status": "ok"}

    # ───────── Frontend settings ─────────
    @app.get("/frontend_settings")
    async def frontend_settings():
        return jsonify(FRONTEND_SETTINGS), 200

    # ───────── Conversation endpoint ─────────
    @app.post("/conversation")
    async def conversation():
        if not request.is_json:
            return jsonify({"error": "JSON required"}), 415

        data = await request.get_json()
        messages = data.get("messages", [])

        if not client:
            return jsonify({"choices": [{"message": {"role": "assistant", "content": "(Echo mode active — backend not configured)"}}]}), 200

        try:
            def _call():
                return client.chat.completions.create(
                    model=AZURE_OPENAI_MODEL,
                    messages=messages,
                )

            resp = await asyncio.to_thread(_call)
            content = resp.choices[0].message.content or "(no content)"
            return jsonify({"choices": [{"message": {"role": "assistant", "content": content}}]}), 200
        except Exception as e:
            logging.exception("chat_failed")
            return jsonify({"error": str(e)}), 500

    # ───────── Summarize File ─────────
    @app.post("/summarize_file")
    async def summarize_file():
        if not request.is_json:
            return jsonify({"error": "JSON required"}), 415
        if not client:
            return jsonify({"error": "Model not configured"}), 500

        data = await request.get_json()
        file_url = data.get("url")
        question = data.get("question") or "Summarize this file."

        if not file_url:
            return jsonify({"error": "missing_url"}), 400

        try:
            def _call():
                return client.chat.completions.create(
                    model=AZURE_OPENAI_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a California family law legal assistant who writes clear, accurate summaries of attached documents.",
                        },
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": question},
                                {"type": "file", "file": {"url": file_url}},
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

    # ───────── Upload SAS Helper ─────────
    def _parse_conn_str(cs: str):
        parts = dict(kv.split("=", 1) for kv in cs.split(";") if "=" in kv)
        return parts.get("AccountName"), parts.get("AccountKey")

    @app.post("/api/get-upload-url")
    async def get_upload_url():
        if not request.is_json:
            return jsonify({"error": "JSON required"}), 415

        data = await request.get_json()
        file_name = data.get("fileName") or f"upload-{uuid.uuid4()}.bin"

        conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not conn:
            return jsonify({"error": "AZURE_STORAGE_CONNECTION_STRING missing"}), 500

        acct, key = _parse_conn_str(conn)
        if not (acct and key):
            return jsonify({"error": "Invalid connection string"}), 500

        container = "chatuploads"
        expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)

        sas = generate_blob_sas(
            account_name=acct,
            container_name=container,
            blob_name=file_name,
            account_key=key,
            permission=BlobSasPermissions(read=True, write=True, create=True),
            expiry=expiry,
        )

        base = f"https://{acct}.blob.core.windows.net"
        read_url = f"{base}/{container}/{file_name}?{sas}"

        return jsonify({"sasUrl": read_url, "blobUrl": read_url}), 200

    return app


# ──────────────────────────────────────────────
# APP INSTANCE
# ──────────────────────────────────────────────
app = create_app()
