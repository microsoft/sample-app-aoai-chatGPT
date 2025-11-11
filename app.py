# app.py — Quart backend for SWA chat (strict CORS, Azure OpenAI, SAS uploads)

import os
import json
import uuid
import logging
import datetime
import asyncio
from typing import Optional

from quart import Quart, jsonify, request, redirect, Response
from quart_cors import cors

# Azure OpenAI
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

BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", "").strip() or "https://pb25.azurewebsites.net"

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY") or (
    "dev_only_do_not_use_in_prod" if DEBUG else None
)
if not SESSION_SECRET_KEY:
    raise RuntimeError("SESSION_SECRET_KEY must be set in production")

# Azure OpenAI config
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_MODEL = os.getenv("AZURE_OPENAI_MODEL")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION", "2024-05-01-preview")

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

    # Initialize Azure OpenAI client if configured
    client: Optional[AzureOpenAI] = None
    if AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY and AZURE_OPENAI_MODEL:
        client = AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_OPENAI_KEY,
            api_version=OPENAI_API_VERSION,
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
        fs["api_versio_]()
