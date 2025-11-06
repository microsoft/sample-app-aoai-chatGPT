import copy
import json
import os
import logging
import uuid
import httpx
import asyncio
import datetime
import io  # Added for in-memory file handling

from quart import (
    Blueprint,
    Quart,
    jsonify,
    make_response,
    request,
    send_from_directory,
    render_template,
    current_app,
)
from quart_cors import cors  # --- THIS IS THE CORS FIX IMPORT ---

from openai import AsyncAzureOpenAI
from azure.identity.aio import (
    DefaultAzureCredential,
    get_bearer_token_provider
)

# --- BLOB STORAGE IMPORTS ---
from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob import generate_blob_sas, BlobSasPermissions

# --- FILE PROCESSING IMPORTS ---
import docx  # For Word documents
from pypdf import PdfReader  # For PDF documents
from azure.core.credentials import AzureKeyCredential
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures

from backend.auth.auth_utils import get_authenticated_user_details
from backend.security.ms_defender_utils import get_msdefender_user_json
from backend.history.cosmosdbservice import CosmosConversationClient
from backend.settings import (
    app_settings,
    MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION
)
from backend.utils import (
    format_as_ndjson,
    format_stream_response,
    format_non_streaming_response,
    convert_to_pf_format,
    format_pf_non_streaming_response,
)

bp = Blueprint("routes", __name__, static_folder="static", template_folder="static")

cosmos_db_ready = asyncio.Event()


def create_app():
    # Configure Quart to serve files from the 'static' folder directly from the root URL path
    app = Quart(__name__, static_folder='static', static_url_path='/')

    # --- THIS LINE FIXES THE CORS ERROR ---
    app = cors(app, allow_origin="https://white-stone-09b65ea1e.3.azurestaticapps.net", allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["*"])
    # --- END OF CORS FIX ---

    app.register_blueprint(bp)
    app.config["TEMPLATES_AUTO_RELOAD"] = True

    # Explicitly serve index.html for the root path '/'
    @app.route("/")
    async def serve_index_explicitly():
        return await app.send_static_file('index.html')

    @app.before_serving
    async def init():
        try:
            app.cosmos_conversation_client = await init_cosmosdb_client()
            cosmos_db_ready.set()
        except Exception as e:
            logging.exception("Failed to initialize CosmosDB client")
            app.cosmos_conversation_client = None

    return app

# --- Serve Static Files ---
@bp.route("/")
async def serve_index():
    return await send_from_directory("static", "index.html")

# --- (Static file routes, Debug settings, Frontend settings, etc. are unchanged) ---
@bp.route("/script.js")
async def serve_script():
    return await send_from_directory("static", "script.js")

@bp.route("/style.css")
async def serve_style():
    return await send_from_directory("static", "style.css")

@bp.route("/favicon.ico")
async def favicon():
    return await bp.send_static_file("favicon.ico")

@bp.route("/assets/<path:path>")
async def assets(path):
    return await send_from_directory("static/assets", path)

DEBUG = os.environ.get("DEBUG", "false")
if DEBUG.lower() == "true":
    logging.basicConfig(level=logging.DEBUG)
USER_AGENT = "GitHubSampleWebApp/AsyncAzureOpenAI/1.0.0"
frontend_settings = {
    "auth_enabled": app_settings.base_settings.auth_enabled,
    "feedback_enabled": (
        app_settings.chat_history and
        app_settings.chat_history.enable_feedback
    ),
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
MS_DEFENDER_ENABLED = os.environ.get("MS_DEFENDER_ENABLED", "true").lower() == "true"
azure_openai_tools = []
azure_openai_available_tools = []

async def init_openai_client():
    azure_openai_client = None
    try:
        if (
            app_settings.azure_openai.preview_api_version
            < MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION
        ):
            raise ValueError(
                f"The minimum supported Azure OpenAI preview API version is '{MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION}'"
            )
        if (
            not app_settings.azure_openai.endpoint and
            not app_settings.azure_openai.resource
        ):
            raise ValueError(
                "AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_RESOURCE is required"
            )
        endpoint = app_settings.azure_openai.endpoint or f"https://{app_settings.azure_openai.resource}.openai.azure.com/"
        aoai_api_key = app_settings.azure_openai.key
        ad_token_provider = None
        if not aoai_api_key:
            logging.info("No AZURE_OPENAI_KEY found, attempting Azure Entra ID auth using DefaultAzureCredential")
            async with DefaultAzureCredential() as credential:
                ad_token_provider = get_bearer_token_provider(
                    credential,
                    "https://cognitiveservices.azure.com/.default"
                )
        else:
            logging.debug("Using AZURE_OPENAI_KEY for authentication.")
        deployment = app_settings.azure_openai.model
        if not deployment:
            raise ValueError("AZURE_OPENAI_MODEL deployment name is required")
        default_headers = {"x-ms-useragent": USER_AGENT}
        if app_settings.azure_openai.function_call_azure_functions_enabled:
            azure_functions_tools_url = f"{app_settings.azure_openai.function_call_azure_functions_tools_base_url}?code={app_settings.azure_openai.function_call_azure_functions_tools_key}"
            async with httpx.AsyncClient() as client:
                response = await client.get(azure_functions_tools_url)
            response_status_code = response.status_code
            if response_status_code == httpx.codes.OK:
                azure_openai_tools.extend(json.loads(response.text))
                for tool in azure_openai_tools:
                    azure_openai_available_tools.append(tool["function"]["name"])
            else:
                logging.error(f"An error occurred while getting OpenAI Function Call tools metadata: {response.status_code}")
        
        logging.info(f"Initializing Azure OpenAI client for endpoint {endpoint} and deployment {deployment}")
        azure_openai_client = AsyncAzureOpenAI(
            api_version=app_settings.azure_openai.preview_api_version,
            api_key=aoai_api_key,
            azure_ad_token_provider=ad_token_provider,
            default_headers=default_headers,
            azure_endpoint=endpoint,
        )
        return azure_openai_client
    except Exception as e:
        logging.exception("Exception during Azure OpenAI client initialization", exc_info=e)
        azure_openai_client = None
        raise e

async def init_cosmosdb_client():
    cosmos_conversation_client = None
    if app_settings.chat_history:
        logging.info("Chat history is enabled, attempting to initialize CosmosDB client.")
        try:
            cosmos_endpoint = (
                f"https://{app_settings.chat_history.account}.documents.azure.com:443/"
            )
            logging.info(f"Cosmos DB endpoint: {cosmos_endpoint}")
            credential = None
            if not app_settings.chat_history.account_key:
                logging.info("No Cosmos DB account key found, attempting Azure Entra ID auth using DefaultAzureCredential.")
                async with DefaultAzureCredential() as cred:
                    credential = cred
                logging.info("Using DefaultAzureCredential for Cosmos DB.")
            else:
                logging.debug("Using Cosmos DB account key for authentication.")
                credential = app_settings.chat_history.account_key
            if not app_settings.chat_history.database:
                raise ValueError("CosmosDB database name (CHAT_HISTORY__DATABASE) is required but not configured.")
            if not app_settings.chat_history.conversations_container:
                raise ValueError("CosmosDB container name (CHAT_HISTORY__CONVERSATIONS_CONTAINER) is required but not configured.")
            cosmos_conversation_client = CosmosConversationClient(
                cosmosdb_endpoint=cosmos_endpoint,
                credential=credential,
                database_name=app_settings.chat_history.database,
                container_name=app_settings.chat_history.conversations_container,
                enable_message_feedback=app_settings.chat_history.enable_feedback,
            )
            logging.info("CosmosDB client initialized successfully.")
        except Exception as e:
            logging.exception("Exception during CosmosDB client initialization", exc_info=e)
            cosmos_conversation_client = None
            raise e
    else:
        logging.warning("Chat history is not configured. Chat history will not be saved.")
    return cosmos_conversation_client

def prepare_model_args(request_body, request_headers):
    request_messages = request_body.get("messages", [])
    messages = []
    if not app_settings.datasource:
        messages = [
            {
                "role": "system",
                "content": app_settings.azure_openai.system_message
            }
        ]
    for message in request_messages:
        if message:
            match message["role"]:
                case "user":
                    messages.append(
                        {
                            "role": message["role"],
                            "content": message["content"]
                        }
                    )
                case "assistant" | "function" | "tool":
                    messages_helper = {}
                    messages_helper["role"] = message["role"]
                    if "name" in message:
                        messages_helper["name"] = message["name"]
                    if "function_call" in message:
                        messages_helper["function_call"] = message["function_call"]
                    messages_helper["content"] = message["content"]
                    if "context" in message:
                        messages_helper["context"] = message.get("context")
                    messages.append(messages_helper)

    user_security_context = None
    if (MS_DEFENDER_ENABLED):
        authenticated_user_details = get_authenticated_user_details(request_headers)
        application_name = app_settings.ui.title
        user_security_context = get_msdefender_user_json(authenticated_user_details, request_headers, application_name )
    
    model_args = {
        "messages": messages,
        "temperature": app_settings.azure_openai.temperature,
        "max_tokens": app_settings.azure_openai.max_tokens,
        "top_p": app_settings.azure_openai.top_p,
        "stop": app_settings.azure_openai.stop_sequence,
        "stream": app_settings.azure_openai.stream,
        "model": app_settings.azure_openai.model
    }
    if len(messages) > 0:
        if messages[-1]["role"] == "user":
            if app_settings.azure_openai.function_call_azure_functions_enabled and len(azure_openai_tools) > 0:
                model_args["tools"] = azure_openai_tools
            if app_settings.datasource:
                model_args["extra_body"] = {
                    "data_sources": [
                        app_settings.datasource.construct_payload_configuration(
                            request=request
                        )
                    ]
                }
    model_args_clean = copy.deepcopy(model_args)
    if model_args_clean.get("extra_body"):
        secret_params = [
            "key",
            "connection_string",
            "embedding_key",
            "encoded_api_key",
            "api_key",
        ]
        if "data_sources" in model_args_clean["extra_body"]:
            for ds in model_args_clean["extra_body"]["data_sources"]:
                if "parameters" in ds:
                    for secret_param in secret_params:
                        if ds["parameters"].get(secret_param):
                            ds["parameters"][secret_param] = "*****"
                    authentication = ds["parameters"].get("authentication", {})
                    for field in authentication:
                        if field in secret_params:
                            authentication[field] = "*****"
                    embeddingDependency = ds["parameters"].get("embedding_dependency", {})
                    if "authentication" in embeddingDependency:
                        for field in embeddingDependency["authentication"]:
                            if field in secret_params:
                                embeddingDependency["authentication"][field] = "*****"
    if model_args.get("extra_body") is None:
        model_args["extra_body"] = {}
    if user_security_context:
            model_args["extra_body"]["user_security_context"]= user_security_context.to_dict()
    logging.debug(f"REQUEST BODY: {json.dumps(model_args_clean, indent=4)}")
    return model_args

def extract_text_from_pdf(file_bytes: bytes) -> str:
    logging.info("Extracting text from PDF...")
    text = ""
    with io.BytesIO(file_bytes) as f:
        reader = PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    logging.info("Extracting text from DOCX...")
    text = ""
    with io.BytesIO(file_bytes) as f:
        doc = docx.Document(f)
        for para in doc.paragraphs:
            text += para.text + "\n"
    return text

async def extract_text_from_image(file_bytes: bytes) -> str:
    logging.info("Extracting text from image...")
    try:
        vision_endpoint = os.environ["AZURE_AI_VISION_ENDPOINT"]
        vision_key = os.environ["AZURE_AI_VISION_KEY"]
    except KeyError:
        logging.error("AZURE_AI_VISION_ENDPOINT or AZURE_AI_VISION_KEY not set.")
        return "[Could not analyze image: AI Vision service is not configured]"
    client = ImageAnalysisClient(
        endpoint=vision_endpoint,
        credential=AzureKeyCredential(vision_key)
    )
    analysis = await client.analyze(
        image_data=file_bytes,
        visual_features=[VisualFeatures.READ],
    )
    await client.close()
    if analysis.read and analysis.read.blocks:
        return "\n".join([line.text for block in analysis.read.blocks for line in block.lines])
    else:
        return "[No text found in image]"

async def promptflow_request(request):
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {app_settings.promptflow.api_key}",
        }
        logging.debug(f"Setting timeout to {app_settings.promptflow.response_timeout}")
        async with httpx.AsyncClient(
            timeout=float(app_settings.promptflow.response_timeout)
        ) as client:
            pf_formatted_obj = convert_to_pf_format(
                request,
                app_settings.promptflow.request_field_name,
                app_settings.promptflow.response_field_name
            )
            response = await client.post(
                app_settings.promptflow.endpoint,
                json={
                    app_settings.promptflow.request_field_name: pf_formatted_obj[-1]["inputs"][app_settings.promptflow.request_field_name],
                    "chat_history": pf_formatted_obj[:-1],
                },
                headers=headers,
            )
        resp = response.json()
        resp["id"] = request["messages"][-1]["id"]
        return resp
    except Exception as e:
        logging.error(f"An error occurred while making promptflow_request: {e}")

async def process_function_call(response):
    response_message = response.choices[0].message
    messages = []
    if response_message.tool_calls:
        for tool_call in response_message.tool_calls:
            if tool_call.function.name not in azure_openai_available_tools:
                continue
            function_response = await openai_remote_azure_function_call(tool_call.function.name, tool_call.function.arguments)
            messages.append(
                {
                    "role": response_message.role,
                    "function_call": {
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments,
                    },
                    "content": None,
                }
            )
            messages.append(
                {
                    "role": "function",
                    "name": tool_call.function.name,
                    "content": function_response,
                }
            )
        return messages
    return None

async def send_chat_request(request_body, request_headers):
    filtered_messages = []
    messages = request_body.get("messages", [])
    for message in messages:
        if message.get("role") != 'tool':
            filtered_messages.append(message)
    request_body['messages'] = filtered_messages
    model_args = prepare_model_args(request_body, request_headers)
    try:
        azure_openai_client = await init_openai_client()
        if not azure_openai_client:
            raise Exception("Azure OpenAI client failed to initialize.")
        raw_response = await azure_openai_client.chat.completions.with_raw_response.create(**model_args)
        response = raw_response.parse()
        apim_request_id = raw_response.headers.get("apim-request-id") 
    except Exception as e:
        logging.exception("Exception in send_chat_request")
        raise e
    return response, apim_request_id

async def complete_chat_request(request_body, request_headers):
    if app_settings.base_settings.use_promptflow:
        response = await promptflow_request(request_body)
        history_metadata = request_body.get("history_metadata", {})
        return format_pf_non_streaming_response(
            response,
            history_metadata,
            app_settings.promptflow.response_field_name,
            app_settings.promptflow.citations_field_name
        )
    else:
        response, apim_request_id = await send_chat_request(request_body, request_headers)
        history_metadata = request_body.get("history_metadata", {})
        non_streaming_response = format_non_streaming_response(response, history_metadata, apim_request_id)
        if app_settings.azure_openai.function_call_azure_functions_enabled:
            function_response = await process_function_call(response)
            if function_response:
                request_body["messages"].extend(function_response)
                response, apim_request_id = await send_chat_request(request_body, request_headers)
                history_metadata = request_body.get("history_metadata", {})
                non_streaming_response = format_non_streaming_response(response, history_metadata, apim_request_id)
    return non_streaming_response

class AzureOpenaiFunctionCallStreamState():
    def __init__(self):
        self.tool_calls = []
        self.tool_name = ""
        self.tool_arguments_stream = ""
        self.current_tool_call = None
        self.function_messages = []
        self.streaming_state = "INITIAL"

async def process_function_call_stream(completionChunk, function_call_stream_state, request_body, request_headers, history_metadata, apim_request_id):
    if hasattr(completionChunk, "choices") and len(completionChunk.choices) > 0:
        response_message = completionChunk.choices[0].delta
        if response_message.tool_calls and function_call_stream_state.streaming_state in ["INITIAL", "STREAMING"]:
            function_call_stream_state.streaming_state = "STREAMING"
            for tool_call_chunk in response_message.tool_calls:
                if tool_call_chunk.id:
                    if function_call_stream_state.current_tool_call:
                        function_call_stream_state.tool_arguments_stream += tool_call_chunk.function.arguments if tool_call_chunk.function.arguments else ""
                        function_call_stream_state.current_tool_call["tool_arguments"] = function_call_stream_state.tool_arguments_stream
                        function_call_stream_state.tool_arguments_stream = ""
                        function_call_stream_state.tool_name = ""
                        function_call_stream_state.tool_calls.append(function_call_stream_state.current_tool_call)
                    function_call_stream_state.current_tool_call = {
                        "tool_id": tool_call_chunk.id,
                        "tool_name": tool_call_chunk.function.name if function_call_stream_state.tool_name == "" else function_call_stream_state.tool_name
                    }
                else:
                    function_call_stream_state.tool_arguments_stream += tool_call_chunk.function.arguments if tool_call_chunk.function.arguments else ""
        elif response_message.tool_calls is None and function_call_stream_state.streaming_state == "STREAMING":
            function_call_stream_state.current_tool_call["tool_arguments"] = function_call_stream_state.tool_arguments_stream
            function_call_stream_state.tool_calls.append(function_call_stream_state.current_tool_call)
            for tool_call in function_call_stream_state.tool_calls:
                tool_response = await openai_remote_azure_function_call(tool_call["tool_name"], tool_call["tool_arguments"])
                function_call_stream_state.function_messages.append({
                    "role": "assistant",
                    "function_call": {
                        "name" : tool_call["tool_name"],
                        "arguments": tool_call["tool_arguments"]
                    },
                    "content": None
                })
                function_call_stream_state.function_messages.append({
                    "tool_call_id": tool_call["tool_id"],
                    "role": "function",
                    "name": tool_call["tool_name"],
                    "content": tool_response,
                })
            function_call_stream_state.streaming_state = "COMPLETED"
            return function_call_stream_state.streaming_state
        else:
            return function_call_stream_state.streaming_state

async def stream_chat_request(request_body, request_headers):
    response, apim_request_id = await send_chat_request(request_body, request_headers)
    history_metadata = request_body.get("history_metadata", {})
    async def generate(apim_request_id, history_metadata):
        if app_settings.azure_openai.function_call_azure_functions_enabled:
            function_call_stream_state = AzureOpenaiFunctionCallStreamState()
            async for completionChunk in response:
                stream_state = await process_function_call_stream(completionChunk, function_call_stream_state, request_body, request_headers, history_metadata, apim_request_id)
                if stream_state == "INITIAL":
                    yield format_stream_response(completionChunk, history_metadata, apim_request_id)
                if stream_state == "COMPLETED":
                    request_body["messages"].extend(function_call_stream_state.function_messages)
                    function_response, apim_request_id = await send_chat_request(request_body, request_headers)
                    async for functionCompletionChunk in function_response:
                        yield format_stream_response(functionCompletionChunk, history_metadata, apim_request_id)
        else:
            async for completionChunk in response:
                yield format_stream_response(completionChunk, history_metadata, apim_request_id)
    return generate(apim_request_id=apim_request_id, history_metadata=history_metadata)

async def conversation_internal(request_body, request_headers):
    try:
        if app_settings.azure_openai.stream and not app_settings.base_settings.use_promptflow:
            result = await stream_chat_request(request_body, request_headers)
            response = await make_response(format_as_ndjson(result))
            response.timeout = None
            response.mimetype = "application/json-lines"
            return response
        else:
            result = await complete_chat_request(request_body, request_headers)
            return jsonify(result)
    except Exception as ex:
        logging.exception(ex)
        if hasattr(ex, "status_code"):
            return jsonify({"error": str(ex)}), ex.status_code
        else:
            return jsonify({"error": str(ex)}), 500

@bp.route("/conversation", methods=["POST"])
async def conversation():
    if not request.is_json:
        return jsonify({"error": "request must be json"}), 415
    request_json = await request.get_json()
    return await conversation_internal(request_json, request.headers)

@bp.route("/frontend_settings", methods=["GET"])
def get_frontend_settings():
    try:
        return jsonify(frontend_settings), 200
    except Exception as e:
        logging.exception("Exception in /frontend_settings")
        return jsonify({"error": str(e)}), 500

# --- *** NEW LOGIN ENDPOINT *** ---
@bp.route("/api/login", methods=["POST"])
async def login():
    try:
        data = await request.get_json()
        password = data.get("password")
        
        # Get the password from the environment variable (set in Azure App Service config)
        app_password = os.environ.get("APP_PASSWORD")

        if not app_password:
            logging.error("APP_PASSWORD environment variable is not set.")
            return jsonify({"error": "Server is not configured for login."}), 500

        if password == app_password:
            logging.info("User login successful.")
            # We can expand this later to return a session token if needed
            return jsonify({"status": "ok"}), 200
        else:
            logging.warning("Failed login attempt.")
            return jsonify({"error": "Invalid password"}), 401
            
    except Exception as e:
        logging.exception("Exception in /api/login")
        return jsonify({"error": str(e)}), 500
# --- *** END NEW LOGIN ENDPOINT *** ---


@bp.route("/api/get-upload-url", methods=["POST"])
async def get_upload_url():
    # This route is now protected by the login, so we don't need extra auth here.
    request_body = await request.get_json()
    file_name = request_body.get("fileName")
    if not file_name:
        logging.warning("get_upload_url called without fileName.")
        return jsonify({"error": "fileName is required"}), 400
    storage_connection_string = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
    if not storage_connection_string:
        logging.error("AZURE_STORAGE_CONNECTION_STRING is not set in environment variables.")
        return jsonify({"error": "Azure Storage connection string not configured"}), 500
    container_name = "chatuploads"
    blob_service_client = None 
    try:
        logging.info(f"Generating SAS URL for: {container_name}/{file_name}")
        blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=container_name,
            blob_name=file_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(create=True, write=True),
            expiry=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)
        )
        sas_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{file_name}?{sas_token}"
        blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{file_name}"
        logging.info(f"Successfully generated SAS URL for {file_name}")
        return jsonify({"sasUrl": sas_url, "blobUrl": blob_url})
    except Exception as e:
        logging.exception("Failed to generate SAS URL", exc_info=e)
        return jsonify({"error": f"Failed to generate upload URL: {str(e)}"}), 500
    finally:
        if blob_service_client:
            await blob_service_client.close()

# --- (Removed manual OPTIONS route, quart-cors handles it) ---

@bp.route("/history/generate", methods=["POST"])
async def add_conversation():
    # This route is now protected by the login.
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)
    
    # --- START OF FILE PROCESSING BLOCK (v2: Multi-file support) ---
    messages = request_json.get("messages", [])
    if messages and messages[-1]["role"] == "user" and "context" in messages[-1]:
        file_context = messages[-1].get("context", {})
        file_url = file_context.get("attached_file_url")
        if file_url:
            logging.info(f"File URL found: {file_url}")
            try:
                storage_connection_string = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
                if not storage_connection_string:
                    raise Exception("AZURE_STORAGE_CONNECTION_STRING not set.")
                container_name = "chatuploads"
                blob_name = file_url.split(f"/{container_name}/")[-1]
                logging.info(f"Downloading blob: {blob_name} from container: {container_name}")
                blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)
                blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
                stream_downloader = await blob_client.download_blob()
                file_content_bytes = await stream_downloader.readall()
                await blob_service_client.close()
                logging.info(f"File downloaded, determining type: {blob_name}")
                file_text = ""
                file_ext = os.path.splitext(blob_name)[1].lower()
                if file_ext == ".pdf":
                    file_text = extract_text_from_pdf(file_content_bytes)
                elif file_ext == ".docx":
                    file_text = extract_text_from_docx(file_content_bytes)
                elif file_ext in [".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tiff"]:
                    file_text = await extract_text_from_image(file_content_bytes)
                else:
                    file_text = f"[Unsupported file type: {file_ext}]"
                logging.info(f"Extracted {len(file_text)} characters from {blob_name}.")
                original_message = messages[-1]["content"]
                messages[-1]["content"] = f"""
Here is the content of the attached document named '{blob_name}':
---[START OF DOCUMENT]---
{file_text}
---[END OF DOCUMENT]---

Now, please answer my original question: {original_message}
"""
                request_json["messages"] = messages
            except Exception as e:
                logging.error(f"Failed to process attached file: {e}")
                return jsonify({"error": f"Failed to read the attached file: {str(e)}"}), 500
    # --- END OF FILE PROCESSING BLOCK ---

    try:
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")
        history_metadata = {}
        if not conversation_id:
            title = await generate_title(request_json["messages"])
            conversation_dict = await current_app.cosmos_conversation_client.create_conversation(
                user_id=user_id, title=title
            )
            conversation_id = conversation_dict["id"]
            history_metadata["title"] = title
            history_metadata["date"] = conversation_dict["createdAt"]
        
        if len(messages) > 0 and messages[-1]["role"] == "user":
            createdMessageValue = await current_app.cosmos_conversation_client.create_message(
                uuid=str(uuid.uuid4()),
                conversation_id=conversation_id,
                user_id=user_id,
                input_message=messages[-1],
            )
            if createdMessageValue == "Conversation not found":
                raise Exception(
                    "Conversation not found for the given conversation ID: "
                    + conversation_id
                    + "."
                )
        else:
            raise Exception("No user message found")
        
        request_body = request_json  
        history_metadata["conversation_id"] = conversation_id
        request_body["history_metadata"] = history_metadata
        return await conversation_internal(request_body, request.headers)
    except Exception as e:
        logging.exception("Exception in /history/generate")
        return jsonify({"error": str(e)}), 500

# --- (All other /history/ routes are unchanged) ---
@bp.route("/history/update", methods=["POST"])
async def update_conversation():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)
    try:
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")
        if not conversation_id:
            raise Exception("No conversation_id found")
        messages = request_json["messages"]
        if len(messages) > 0 and messages[-1]["role"] == "assistant":
            if len(messages) > 1 and messages[-2].get("role", None) == "tool":
                await current_app.cosmos_conversation_client.create_message(
                    uuid=str(uuid.uuid4()),
                    conversation_id=conversation_id,
                    user_id=user_id,
                    input_message=messages[-2],
                )
            await current_app.cosmos_conversation_client.create_message(
                uuid=messages[-1]["id"],
                conversation_id=conversation_id,
                user_id=user_id,
                input_message=messages[-1],
            )
        else:
            raise Exception("No bot messages found")
        response = {"success": True}
        return jsonify(response), 200
    except Exception as e:
        logging.exception("Exception in /history/update")
        return jsonify({"error": str(e)}), 500

@bp.route("/history/message_feedback", methods=["POST"])
async def update_message():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    message_id = request_json.get("message_id", None)
    message_feedback = request_json.get("message_feedback", None)
    try:
        if not message_id:
            return jsonify({"error": "message_id is required"}), 400
        if not message_feedback:
            return jsonify({"error": "message_feedback is required"}), 400
        updated_message = await current_app.cosmos_conversation_client.update_message_feedback(
            user_id, message_id, message_feedback
        )
        if updated_message:
            return (
                jsonify(
                    {
                        "message": f"Successfully updated message with feedback {message_feedback}",
                        "message_id": message_id,
                    }
                ),
                200,
            )
        else:
            return (
                jsonify(
                    {
                        "error": f"Unable to update message {message_id}. It either does not exist or the user does not have access to it."
                    }
                ),
                404,
            )
    except Exception as e:
        logging.exception("Exception in /history/message_feedback")
        return jsonify({"error": str(e)}), 500

@bp.route("/history/delete", methods=["DELETE"])
async def delete_conversation():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)
    try:
        if not conversation_id:
            return jsonify({"error": "conversation_id is required"}), 400
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")
        deleted_messages = await current_app.cosmos_conversation_client.delete_messages(
            conversation_id, user_id
        )
        deleted_conversation = await current_app.cosmos_conversation_client.delete_conversation(
            user_id, conversation_id
        )
        return (
            jsonify(
                {
                    "message": "Successfully deleted conversation and messages",
                    "conversation_id": conversation_id,
                }
            ),
            200,
        )
    except Exception as e:
        logging.exception("Exception in /history/delete")
        return jsonify({"error": str(e)}), 500

@bp.route("/history/list", methods=["GET"])
async def list_conversations():
    await cosmos_db_ready.wait()
    offset = request.args.get("offset", 0)
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    if not current_app.cosmos_conversation_client:
        raise Exception("CosmosDB is not configured or not working")
    conversations = await current_app.cosmos_conversation_client.get_conversations(
        user_id, offset=offset, limit=25
    )
    if not isinstance(conversations, list):
        return jsonify({"error": f"No conversations for {user_id} were found"}), 404
    return jsonify(conversations), 200

@bp.route("/history/read", methods=["POST"])
async def get_conversation():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)
    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400
    if not current_app.cosmos_conversation_client:
        raise Exception("CosmosDB is not configured or not working")
    conversation = await current_app.cosmos_conversation_client.get_conversation(
        user_id, conversation_id
    )
    if not conversation:
        return (
            jsonify(
                {
                    "error": f"Conversation {conversation_id} was not found. It either does not exist or the logged in user does not have access to it."
                }
            ),
            404,
        )
    conversation_messages = await current_app.cosmos_conversation_client.get_messages(
        user_id, conversation_id
    )
    messages = [
        {
            "id": msg["id"],
            "role": msg["role"],
            "content": msg["content"],
            "createdAt": msg["createdAt"],
            "feedback": msg.get("feedback"),
        }
        for msg in conversation_messages
    ]
    return jsonify({"conversation_id": conversation_id, "messages": messages}), 200

@bp.route("/history/rename", methods=["POST"])
async def rename_conversation():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)
    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400
    if not current_app.cosmos_conversation_client:
        raise Exception("CosmosDB is not configured or not working")
    conversation = await current_app.cosmos_conversation_client.get_conversation(
        user_id, conversation_id
    )
    if not conversation:
        return (
            jsonify(
                {
                    "error": f"Conversation {conversation_id} was not found. It either does not exist or the logged in user does not have access to it."
                }
            ),
            404,
        )
    title = request_json.get("title", None)
    if not title:
        return jsonify({"error": "title is required"}), 400
    conversation["title"] = title
    updated_conversation = await current_app.cosmos_conversation_client.upsert_conversation(
        conversation
    )
    return jsonify(updated_conversation), 200

@bp.route("/history/delete_all", methods=["DELETE"])
async def delete_all_conversations():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    try:
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")
        conversations = await current_app.cosmos_conversation_client.get_conversations(
            user_id, offset=0, limit=None
        )
        if not conversations:
            return jsonify({"error": f"No conversations for {user_id} were found"}), 404
        for conversation in conversations:
            deleted_messages = await current_app.cosmos_conversation_client.delete_messages(
                conversation["id"], user_id
            )
            deleted_conversation = await current_app.cosmos_conversation_client.delete_conversation(
                user_id, conversation["id"]
            )
        return (
            jsonify(
                {
                    "message": f"Successfully deleted conversation and messages for user {user_id}"
                }
            ),
            200,
        )
    except Exception as e:
        logging.exception("Exception in /history/delete_all")
        return jsonify({"error": str(e)}), 500

@bp.route("/history/clear", methods=["POST"])
async def clear_messages():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)
    try:
        if not conversation_id:
            return jsonify({"error": "conversation_id is required"}), 400
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")
        deleted_messages = await current_app.cosmos_conversation_client.delete_messages(
            conversation_id, user_id
        )
        return (
            jsonify(
                {
                    "message": "Successfully deleted messages in conversation",
                    "conversation_id": conversation_id,
                }
            ),
            200,
        )
    except Exception as e:
        logging.exception("Exception in /history/clear_messages")
        return jsonify({"error": str(e)}), 500

@bp.route("/history/ensure", methods=["GET"])
async def ensure_cosmos():
    await cosmos_db_ready.wait()
    if not app_settings.chat_history:
        return jsonify({"error": "CosmosDB is not configured"}), 404
    try:
        success, err = await current_app.cosmos_conversation_client.ensure()
        if not current_app.cosmos_conversation_client or not success:
            if err:
                return jsonify({"error": err}), 422
            return jsonify({"error": "CosmosDB is not configured or not working"}), 500
        return jsonify({"message": "CosmosDB is configured and working"}), 200
    except Exception as e:
        logging.exception("Exception in /history/ensure")
        cosmos_exception = str(e)
        if "Invalid credentials" in cosmos_exception:
            return jsonify({"error": cosmos_exception}), 401
        elif "Invalid CosmosDB database name" in cosmos_exception:
            return (
                jsonify(
                    {
                        "error": f"{cosmos_exception} {app_settings.chat_history.database} for account {app_settings.chat_history.account}"
                    }
                ),
                422,
            )
        elif "Invalid CosmosDB container name" in cosmos_exception:
            return (
                jsonify(
                    {
                        "error": f"{cosmos_exception}: {app_settings.chat_history.conversations_container}"
                    }
                ),
                422,
            )
        else:
            return jsonify({"error": "CosmosDB is not working"}), 500

async def generate_title(conversation_messages) -> str:
    title_prompt = "Summarize the conversation so far into a 4-word or less title. Do not use any quotation marks or punctuation. Do not include any other commentary or description."
    messages = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in conversation_messages
    ]
    messages.append({"role": "user", "content": title_prompt})
    try:
        azure_openai_client = await init_openai_client()
        response = await azure_openai_client.chat.completions.create(
            model=app_settings.azure_openai.model, messages=messages, temperature=1, max_tokens=64
        )
        title = response.choices[0].message.content
        return title
    except Exception as e:
        logging.exception("Exception while generating title", e)
        return messages[-2]["content"]

app = create_app()
