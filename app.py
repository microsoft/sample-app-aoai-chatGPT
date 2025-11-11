# app.py — clean, minimal backend that works with SWA frontend

import os
import io
import json
import uuid
import logging
import datetime
from typing import Optional

from quart import Quart, jsonify, request, redirect
from quart_cors import cors

# Azure Storage (only used by /api/get-upload-url)
from azure.storage.blob import generate_blob_sas, BlobSasPermissions

# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

FRONTEND_ORIGIN = (
    os.getenv("ALLOWED_ORIGINS", "").split(",")[0].strip()
    or os.getenv("FRONTEND_ORIGIN", "")
    or "https://<your-swa>.azurestaticapps.net"  # set this in App Settings
)

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY") or (
    "dev_only_do_not_use_in_prod" if DEBUG else None
)
if not SESSION_SECRET_KEY:
    raise RuntimeError("SESSION_SECRET_KEY must be set in production")

# You can set these later when we wire real Entra/MSAL
ENTRA_CLIENT_ID = os.getenv("ENTRA_CLIENT_ID")
ENTRA_CLIENT_SECRET = os.getenv("ENTRA_CLIENT_SECRET")
ENTRA_TENANT_ID = os.getenv("ENTRA_TENANT_ID")

# Frontend settings expected by your UI
FRONTEND_SETTINGS = {
    "auth_enabled": True,
    "feedback_enabled": False,
    "oyd_enabled": "none",
    "sanitize_answer": False,
    "ui": {
        "title": os.getenv("UI_TITLE", "Contoso"),
        "logo": None,
        "chat_logo": None,
        "chat_title": os.getenv("UI_CHAT_TITLE", "Start chatting"),
        "chat_description": os.getenv(
            "UI_CHAT_DESC", "This chatbot is configured to answer your questions"
        ),
        "show_share_button": True,
        "show_chat_history_button": True,
    },
}

# ──────────────────────────────────────────────────────────────
# APP FACTORY
# ──────────────────────────────────────────────────────────────
def create_app():
    app = Quart(__name__)
    app.secret_key = SESSION_SECRET_KEY

    # CORS for SWA
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
                "<p>Set <code>FRONTEND_ORIGIN</code> in App Settings to your SWA URL "
                "(e.g., https://white-stone-09b65ea1e.3.azurestaticapps.net) and restart.</p>",
                200,
                {"Content-Type": "text/html"},
            )
        return redirect(fe, 302)

    # ───────── Auth stubs (so the UI can function now) ─────────
    @app.get("/auth/status")
    async def auth_status():
        # When we add real Entra, this will reflect the signed-in user.
        return jsonify({"isAuthenticated": True, "user": {"name": "Demo User"}})

    @app.get("/auth/login")
    async def auth_login():
        # Real flow will start MSAL; for now just go back to the frontend.
        return redirect(FRONTEND_ORIGIN)

    @app.get("/auth/logout")
    async def auth_logout():
        # Clear session when we start storing it; for now just return.
        return redirect(FRONTEND_ORIGIN)

    # ───────── Settings for the frontend ─────────
    @app.get("/frontend_settings")
    async def get_frontend_settings():
        return jsonify(FRONTEND_SETTINGS), 200

    # ───────── Conversation endpoint (simple stub) ─────────
    @app.post("/conversation")
    async def conversation():
        """
        Minimal non-streaming implementation so the UI doesn't break.
        It echoes back the last user message. We can swap in Azure OpenAI later.
        """
        if not request.is_json:
            return jsonify({"error": "request must be json"}), 415

        data = await request.get_json()
        messages = data.get("messages") or []
        last_user = next(
            (m.get("content") for m in reversed(messages) if m.get("role") == "user"),
            "",
        )
        answer = (
            f"You said: {last_user}"
            if last_user
            else "Hello! The backend is connected. (Model not wired yet.)"
        )

        # Return a shape most UIs accept for non-streaming replies
        return jsonify(
            {
                "choices": [
                    {
                        "index": 0,
                        "message": {"role": "assistant", "content": answer},
                        "finish_reason": "stop",
                    }
                ],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            }
        ), 200

    # ───────── Upload SAS helper (works if you set STORAGE conn string) ─────────
    def _parse_conn_str(cs: str):
        parts = dict(kv.split("=", 1) for kv in cs.split(";") if "=" in kv)
        return parts.get("AccountName"), parts.get("AccountKey")

    @app.post("/api/get-upload-url")
    async def get_upload_url():
        """
        Returns a short-lived SAS URL to PUT a file into container 'chatuploads'.
        Requires AZURE_STORAGE_CONNECTION_STRING in App Settings.
        """
        if not request.is_json:
            return jsonify({"error": "request must be json"}), 415
        payload = await request.get_json()
        file_name = (payload or {}).get("fileName") or f"upload-{uuid.uuid4()}.bin"

        conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not conn:
            return (
                jsonify({"error": "AZURE_STORAGE_CONNECTION_STRING not configured"}),
                500,
            )
        acct, key = _parse_conn_str(conn)
        if not (acct and key):
            return jsonify({"error": "Invalid storage connection string"}), 500

        container = "chatuploads"
        expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=10
        )

        sas = generate_blob_sas(
            account_name=acct,
            container_name=container,
            blob_name=file_name,
            account_key=key,
            permission=BlobSasPermissions(create=True, write=True),
            expiry=expiry,
        )
        base = f"https://{acct}.blob.core.windows.net"
        return jsonify(
            {
                "sasUrl": f"{base}/{container}/{file_name}?{sas}",
                "blobUrl": f"{base}/{container}/{file_name}",
            }
        )

    return app


# ──────────────────────────────────────────────────────────────
# APP INSTANCE
# ──────────────────────────────────────────────────────────────
app = create_app()
