# app.py  — stabilized
import os, io, re, json, uuid, logging, datetime, copy, asyncio, httpx
from typing import Optional

from quart import Quart, Blueprint, jsonify, request, send_from_directory, current_app, session, redirect, url_for, make_response
from quart_cors import cors

import docx
from pypdf import PdfReader

from openai import AsyncAzureOpenAI

# Azure identity / storage / vision
from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
from azure.core.credentials import AzureKeyCredential, AccessToken
from azure.core.credentials_async import AsyncTokenCredential

from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob import generate_blob_sas, BlobSasPermissions

from azure.ai.vision.imageanalysis.aio import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures

# Optional Graph (best-effort import)
try:
    from msgraph import GraphServiceClient
    from msgraph.generated.search.query.query_post_request_body import QueryPostRequestBody
    from msgraph.generated.models.search_request import SearchRequest
    from msgraph.generated.models.search_query import SearchQuery
    from msgraph.generated.models.entity_type import EntityType
    GRAPH_AVAILABLE = True
except Exception as e:
    logging.warning(f"Graph SDK unavailable: {e}")
    GraphServiceClient = None
    GRAPH_AVAILABLE = False

# Your project modules
from backend.auth.auth_utils import get_authenticated_user_details
from backend.security.ms_defender_utils import get_msdefender_user_json
from backend.history.cosmosdbservice import CosmosConversationClient
from backend.settings import app_settings, MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION
from backend.utils import (
    format_as_ndjson, format_stream_response, format_non_streaming_response,
    convert_to_pf_format, format_pf_non_streaming_response
)

# ──────────────────────────────────────────────────────────────────────────────
# CONSTANTS / GLOBALS
# ──────────────────────────────────────────────────────────────────────────────
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

FRONTEND_ORIGIN = os.getenv("ALLOWED_ORIGINS", "").split(",")[0].strip() or \
                  os.getenv("FRONTEND_ORIGIN", "") or \
                  "https://<your-swa>.azurestaticapps.net"  # ← set this

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY") or ("dev_only_do_not_use_in_prod" if DEBUG else None)
if not SESSION_SECRET_KEY:
    raise RuntimeError("SESSION_SECRET_KEY must be set in production")

# Entra / MSAL (confidential flow variables)
ENTRA_CLIENT_ID = os.getenv("ENTRA_CLIENT_ID")
ENTRA_CLIENT_SECRET = os.getenv("ENTRA_CLIENT_SECRET")
ENTRA_TENANT_ID = os.getenv("ENTRA_TENANT_ID")
AUTHORITY = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}" if ENTRA_TENANT_ID else None
SCOPES = ["Mail.Read"]
GRAPH_ENDPOINT_ME = "https://graph.microsoft.com/v1.0/me"

USER_AGENT = "JoogmApp/AsyncAzureOpenAI/1.0"

bp = Blueprint("routes", __name__, static_folder="static", template_folder="static")
cosmos_db_ready = asyncio.Event()

# Tools (only when Graph is available)
TOOLS = [{
    "type": "function",
    "function": {
        "name": "search_outlook",
        "description": "Search the user's Outlook mailbox",
        "parameters": {"type": "object","properties":{"search_query":{"type":"string"}},"required":["search_query"]}
    }
}] if GRAPH_AVAILABLE else []

azure_openai_tools = []
azure_openai_available_tools = []

# ──────────────────────────────────────────────────────────────────────────────
# APP FACTORY
# ──────────────────────────────────────────────────────────────────────────────
def create_app():
    app = Quart(__name__, static_folder="static", static_url_path="/static")
    app.secret_key = SESSION_SECRET_KEY

    # CORS – single source of truth
    app = cors(
        app,
        allow_origin=[FRONTEND_ORIGIN],
        allow_methods=["GET","POST","OPTIONS"],
        allow_headers=["Content-Type","Authorization"],
        allow_credentials=True
    )
    # Health check endpoint (used by Azure and for debugging)
    @app.get("/healthz")
    async def healthz():
        return {"status": "ok"}


    @app.get("/")
    async def root():
        # serve index.html from /static (avoid double-binding “/” via blueprint)
        return await app.send_static_file("index.html")

    @app.before_serving
    async def init_clients():
        try:
            app.cosmos_conversation_client = await init_cosmosdb_client()
            cosmos_db_ready.set()
        except Exception:
            logging.exception("Cosmos init failed")
            app.cosmos_conversation_client = None

    # register blueprint for API & assets
    app.register_blueprint(bp)
    return app

# ──────────────────────────────────────────────────────────────────────────────
# STATIC FILE ROUTES (under blueprint to avoid colliding with “/”)
# ──────────────────────────────────────────────────────────────────────────────
@bp.get("/script.js")
async def serve_script():
    return await send_from_directory("static", "script.js")

@bp.get("/style.css")
async def serve_style():
    return await send_from_directory("static", "style.css")

@bp.get("/assets/<path:path>")
async def assets(path):
    return await send_from_directory("static/assets", path)

# ──────────────────────────────────────────────────────────────────────────────
# FRONTEND SETTINGS
# ──────────────────────────────────────────────────────────────────────────────
frontend_settings = {
    "auth_enabled": True,
    "feedback_enabled": (app_settings.chat_history and app_settings.chat_history.enable_feedback),
    "ui": {
        "title": app_settings.ui.title,
        "logo": app_settings.ui.logo,
        "chat_logo": app_settings.ui.chat_logo or app_settings.ui.logo,
        "chat_title": app_settings.ui.chat_title,
        "chat_description": app_settings.ui.chat_description,
        "show_share_button": app_settings.ui.show_share_button,
        "show_chat_history_button": app_settings.ui.show_chat_history_button,
    },
    "sanitize_answer": app_settings.base_settings.sanitize_answer,
    "oyd_enabled": app_settings.base_settings.datasource_type,
}

MS_DEFENDER_ENABLED = os.getenv("MS_DEFENDER_ENABLED", "true").lower() == "true"

# ──────────────────────────────────────────────────────────────────────────────
# OPENAI CLIENT
# ──────────────────────────────────────────────────────────────────────────────
async def init_openai_client():
    if app_settings.azure_openai.preview_api_version < MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION:
        raise ValueError(f"Minimum Azure OpenAI API version is {MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION}")

    endpoint = app_settings.azure_openai.endpoint or f"https://{app_settings.azure_openai.resource}.openai.azure.com/"
    if not endpoint:
        raise ValueError("AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_RESOURCE is required")

    deployment = app_settings.azure_openai.model
    if not deployment:
        raise ValueError("AZURE_OPENAI_MODEL (deployment name) is required")

    key = app_settings.azure_openai.key
    if key:
        provider = None
    else:
        # IMPORTANT: keep credential object alive; do NOT create it in a context manager
        credential = DefaultAzureCredential()
        provider = get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")

    logging.info(f"AOAI init: endpoint={endpoint} deployment={deployment}")
    return AsyncAzureOpenAI(
        api_version=app_settings.azure_openai.preview_api_version,
        api_key=key,
        azure_ad_token_provider=provider,
        default_headers={"x-ms-useragent": USER_AGENT},
        azure_endpoint=endpoint,
    )

# ──────────────────────────────────────────────────────────────────────────────
# COSMOS CLIENT
# ──────────────────────────────────────────────────────────────────────────────
async def init_cosmosdb_client() -> Optional[CosmosConversationClient]:
    if not app_settings.chat_history:
        logging.warning("Chat history not configured")
        return None

    endpoint = f"https://{app_settings.chat_history.account}.documents.azure.com:443/"
    cred = app_settings.chat_history.account_key or DefaultAzureCredential()  # keep ref
    if not app_settings.chat_history.database:
        raise ValueError("CHAT_HISTORY__DATABASE required")
    if not app_settings.chat_history.conversations_container:
        raise ValueError("CHAT_HISTORY__CONVERSATIONS_CONTAINER required")

    client = CosmosConversationClient(
        cosmosdb_endpoint=endpoint,
        credential=cred,
        database_name=app_settings.chat_history.database,
        container_name=app_settings.chat_history.conversations_container,
        enable_message_feedback=app_settings.chat_history.enable_feedback,
    )
    logging.info("Cosmos client initialized")
    return client

# ──────────────────────────────────────────────────────────────────────────────
# MODEL ARG PREP
# ──────────────────────────────────────────────────────────────────────────────
def prepare_model_args(request_body, request_headers):
    base = [{"role": "system", "content": app_settings.azure_openai.system_message}] if not app_settings.datasource else []
    for m in request_body.get("messages", []):
        if m and m["role"] in ("user","assistant","function","tool"):
            base.append(m)

    # Defender context
    user_sec = None
    if MS_DEFENDER_ENABLED:
        if "user" in session:
            session_user = session["user"]
            auth_user = {
                "user_principal_id": session_user.get("userPrincipalName"),
                "user_name": session_user.get("displayName"),
                "user_oid": session_user.get("id"),
            }
        else:
            auth_user = get_authenticated_user_details(request_headers)
        user_sec = get_msdefender_user_json(auth_user, request_headers, app_settings.ui.title)

    model_args = {
        "messages": base,
        "temperature": app_settings.azure_openai.temperature,
        "max_tokens": app_settings.azure_openai.max_tokens,
        "top_p": app_settings.azure_openai.top_p,
        "stop": app_settings.azure_openai.stop_sequence,
        "stream": app_settings.azure_openai.stream,
        "model": app_settings.azure_openai.model,
    }

    # tools and data source
    if base and base[-1]["role"] == "user":
        if not app_settings.azure_openai.function_call_azure_functions_enabled:
            model_args["tools"] = TOOLS
            model_args["tool_choice"] = "auto"
        if app_settings.datasource:
            model_args.setdefault("extra_body", {})["data_sources"] = [
                app_settings.datasource.construct_payload_configuration(request=request)
            ]

    if user_sec:
        model_args.setdefault("extra_body", {})["user_security_context"] = user_sec.to_dict()

    # scrub secrets in logs
    safe = copy.deepcopy(model_args)
    if safe.get("tools"): safe["tools"] = "[REDACTED]"
    if safe.get("extra_body"):
        for ds in safe["extra_body"].get("data_sources", []):
            for field in ("key","connection_string","embedding_key","encoded_api_key","api_key"):
                if ds.get("parameters", {}).get(field):
                    ds["parameters"][field] = "*****"
    logging.debug("REQUEST BODY (safe): %s", json.dumps(safe)[:1500])
    return model_args

# ──────────────────────────────────────────────────────────────────────────────
# FILE EXTRACTORS
# ──────────────────────────────────────────────────────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with io.BytesIO(file_bytes) as f:
        reader = PdfReader(f)
        for p in reader.pages:
            text += (p.extract_text() or "") + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    with io.BytesIO(file_bytes) as f:
        d = docx.Document(f)
        return "\n".join([p.text for p in d.paragraphs])

async def extract_text_from_image(file_bytes: bytes) -> str:
    ep = os.getenv("AZURE_AI_VISION_ENDPOINT")
    key = os.getenv("AZURE_AI_VISION_KEY")
    if not (ep and key):
        logging.error("Vision not configured")
        return "[Vision not configured]"
    client = ImageAnalysisClient(endpoint=ep, credential=AzureKeyCredential(key))
    async with client:
        res = await client.analyze(image_data=file_bytes, visual_features=[VisualFeatures.READ])
    if res.read and res.read.blocks:
        return "\n".join(line.text for b in res.read.blocks for line in b.lines)
    return "[No text found]"

# ──────────────────────────────────────────────────────────────────────────────
# GRAPH TOKEN + SEARCH
# ──────────────────────────────────────────────────────────────────────────────
class GraphTokenCredential(AsyncTokenCredential):
    async def get_token(self, *scopes, **kwargs) -> AccessToken:
        tok = session.get("token_cache")
        if not tok: raise Exception("User is not authenticated")
        # Prefer expires_on (epoch). If only expires_in is present, compute expires_on now.
        expires_on = tok.get("expires_on")
        if not expires_on:
            expires_in = int(tok.get("expires_in", 0))
            expires_on = int(datetime.datetime.now(datetime.timezone.utc).timestamp()) + expires_in
        if "access_token" not in tok:
            raise Exception("No access token in cache")
        return AccessToken(tok["access_token"], int(expires_on))

async def search_outlook(search_query: str) -> str:
    if not GRAPH_AVAILABLE:
        return "Outlook search unavailable."
    try:
        cred = GraphTokenCredential()
        client = GraphServiceClient(credentials=cred)
        body = QueryPostRequestBody(requests=[SearchRequest(
            entity_types=[EntityType.Message],
            query=SearchQuery(query_string=search_query),
            from_=0, size=5
        )])
        results = await client.search.query.post(body)
        out = []
        for hc in (results.value or []):
            for hit in (hc.hits or []):
                r = hit.resource
                if not r: continue
                subj = getattr(r, "subject", "N/A")
                from_addr = getattr(getattr(getattr(r, "from_", None), "email_address", None), "address", "N/A")
                when = getattr(r, "received_date_time", "N/A")
                snip = getattr(hit, "summary", ""); link = getattr(r, "web_link", "#")
                out.append(f"Subject: {subj}\nFrom: {from_addr}\nDate: {when}\nSnippet: {snip}\nURL: {link}\n")
        return "Found the following emails:\n\n" + ("\n---\n".join(out) if out else "No results.")
    except Exception:
        logging.exception("Graph search failed")
        return "Authentication error or Graph search failed."

# ──────────────────────────────────────────────────────────────────────────────
# CHAT PIPELINE (unchanged logic, sturdier clients)
# ──────────────────────────────────────────────────────────────────────────────
async def send_chat_request(request_body, request_headers):
    rb = {**request_body}
    rb["messages"] = [m for m in rb.get("messages", []) if m.get("role") != "tool"]
    args = prepare_model_args(rb, request_headers)
    try:
        client = await init_openai_client()
        raw = await client.chat.completions.with_raw_response.create(**args)
        return raw.parse(), raw.headers.get("apim-request-id")
    except Exception:
        logging.exception("send_chat_request failed")
        raise

async def complete_chat_request(request_body, request_headers):
    if app_settings.base_settings.use_promptflow:
        # omitted: your promptflow path (unchanged)
        return {"not": "implemented_in_this_minimal_example"}
    response, apim_id = await send_chat_request(request_body, request_headers)
    # simple tool call handling
    if response.choices[0].message.tool_calls:
        tool = response.choices[0].message.tool_calls[0]
        fn, args = tool.function.name, json.loads(tool.function.arguments or "{}")
        result = await search_outlook(**args) if fn == "search_outlook" else f"Unknown tool {fn}"
        request_body["messages"].append(response.choices[0].message)
        request_body["messages"].append({"role":"tool","tool_call_id":tool.id,"name":fn,"content":result})
        response, apim_id = await send_chat_request(request_body, request_headers)
    return format_non_streaming_response(response, request_body.get("history_metadata", {}), apim_id)

# ──────────────────────────────────────────────────────────────────────────────
# API ROUTES
# ──────────────────────────────────────────────────────────────────────────────
@bp.get("/frontend_settings")
def get_frontend_settings():
    return jsonify(frontend_settings), 200

@bp.post("/conversation")
async def conversation():
    if "user" not in session:
        return jsonify({"error": "User not authenticated"}), 401
    if not request.is_json:
        return jsonify({"error": "request must be json"}), 415
    data = await request.get_json()
    try:
        return await complete_chat_request(data, request.headers)
    except Exception as ex:
        logging.exception("conversation failed")
        return jsonify({"error": str(ex)}), getattr(ex, "status_code", 500)

# ── Upload SAS helper: parse connection string for account + key
def _parse_conn_str(cs: str):
    parts = dict(kv.split("=",1) for kv in cs.split(";") if "=" in kv)
    return parts.get("AccountName"), parts.get("AccountKey")

@bp.post("/api/get-upload-url")
async def get_upload_url():
    if "user" not in session:
        return jsonify({"error": "User not authenticated"}), 401
    payload = await request.get_json()
    file_name = (payload or {}).get("fileName")
    if not file_name:
        return jsonify({"error": "fileName is required"}), 400

    conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if not conn:
        return jsonify({"error": "AZURE_STORAGE_CONNECTION_STRING not configured"}), 500
    acct, key = _parse_conn_str(conn)
    if not (acct and key):
        return jsonify({"error": "Invalid storage connection string"}), 500

    container = "chatuploads"
    expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)

    sas = generate_blob_sas(
        account_name=acct,
        container_name=container,
        blob_name=file_name,
        account_key=key,
        permission=BlobSasPermissions(create=True, write=True),
        expiry=expiry
    )
    base = f"https://{acct}.blob.core.windows.net"
    return jsonify({
        "sasUrl": f"{base}/{container}/{file_name}?{sas}",
        "blobUrl": f"{base}/{container}/{file_name}"
    })

# (History routes omitted here for brevity – keep your existing ones; the Cosmos client fix above makes them stable.)

# ──────────────────────────────────────────────────────────────────────────────
# APP INSTANCE
# ──────────────────────────────────────────────────────────────────────────────
app = create_app()
