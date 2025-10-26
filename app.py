import copy
import json
import os
import logging
import uuid
import httpx
import asyncio
from quart import (
    Blueprint,
    Quart,
    jsonify,
    make_response,
    request,
    send_from_directory, # Make sure this is imported
    current_app,
    abort # Make sure this is imported
)
# Note: Removed render_template as it's no longer needed for index.html

from openai import AsyncAzureOpenAI
from azure.identity.aio import (
    DefaultAzureCredential,
    get_bearer_token_provider
)
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

# Define the Blueprint, telling Quart where static files are globally
# '/static' is the URL path, 'static' is the folder name in /usr/src/app/
bp = Blueprint("routes", __name__, static_folder="static", static_url_path="/static")

cosmos_db_ready = asyncio.Event()


def create_app():
    # When creating the app, point static_folder to the correct place
    # __name__ tells Quart where to look relative to; 'static' is the folder name
    app = Quart(__name__, static_folder="static")
    app.register_blueprint(bp)
    app.config["TEMPLATES_AUTO_RELOAD"] = True # Keep for potential future templates

    @app.before_serving
    async def init():
        try:
            app.cosmos_conversation_client = await init_cosmosdb_client()
            cosmos_db_ready.set()
        except Exception as e:
            logging.exception("Failed to initialize CosmosDB client")
            app.cosmos_conversation_client = None
            # Decide if you want the app to fail startup if DB isn't ready
            # raise e

    return app


# --- Serve index.html from ui subfolder ---
@bp.route("/")
async def index():
    # Serve index.html from the 'ui' subfolder within the static folder
    # bp.static_folder resolves to /usr/src/app/static
    static_ui_path = os.path.join(bp.static_folder, 'ui')
    logging.debug(f"Attempting to serve index.html from: {static_ui_path}")
    if not os.path.exists(os.path.join(static_ui_path, 'index.html')):
         logging.error(f"index.html not found in {static_ui_path}")
         abort(404)
    return await send_from_directory(static_ui_path, 'index.html')

# --- Serve CSS and JS from ui subfolder ---
@bp.route("/<path:filename>")
async def ui_static(filename):
    # Serve css/js from the 'ui' subfolder within the static folder
    # Check common UI file extensions first
    static_ui_path = os.path.join(bp.static_folder, 'ui')
    logging.debug(f"Attempting to serve {filename} from: {static_ui_path}")
    # Adjust filenames if necessary (e.g., if using index.css instead of style.css)
    if filename.endswith(('.css', '.js')):
        if os.path.exists(os.path.join(static_ui_path, filename)):
             return await send_from_directory(static_ui_path, filename)
        else:
             logging.warning(f"File {filename} not found in {static_ui_path}")
             abort(404) # Not found in UI folder

    # Fallback: Try serving other known static files (like favicon?) from the root static folder
    # Be more specific to avoid catching API routes
    elif filename == 'favicon.ico':
         try:
             logging.debug(f"Attempting to serve {filename} from root static folder: {bp.static_folder}")
             return await bp.send_static_file(filename)
         except Exception as e:
             logging.warning(f"Failed to send static file {filename}: {e}")
             abort(404)
    else:
        # If it's not a known UI file or favicon, assume it's not found
        logging.warning(f"Static file request for unknown path: {filename}")
        abort(404)


# --- Keep original /assets/ route if needed, otherwise remove ---
# This serves files specifically from /usr/src/app/static/assets (URL path /assets/)
# If your new UI doesn't use this, you can comment it out.
@bp.route("/assets/<path:path>")
async def assets(path):
    assets_path = os.path.join(bp.static_folder, "assets")
    logging.debug(f"Attempting to serve asset from: {assets_path} path: {path}")
    if os.path.exists(os.path.join(assets_path, path)):
        return await send_from_directory(assets_path, path)
    else:
        logging.warning(f"Asset not found in {assets_path}: {path}")
        abort(404)


# Debug settings
DEBUG = os.environ.get("DEBUG", "false")
if DEBUG.lower() == "true":
    # Ensure logging is configured only once
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
else:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

USER_AGENT = "GitHubSampleWebApp/AsyncAzureOpenAI/1.0.0"


# Frontend Settings via Environment Variables
frontend_settings = {
    "auth_enabled": app_settings.base_settings.auth_enabled,
    # FIX: Use getattr to safely check for 'enable_feedback', default to False
    "feedback_enabled": (
        app_settings.chat_history and
        getattr(app_settings.chat_history, 'enable_feedback', False)
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


# Enable Microsoft Defender for Cloud Integration
MS_DEFENDER_ENABLED = os.environ.get("MS_DEFENDER_ENABLED", "true").lower() == "true"


azure_openai_tools = []
azure_openai_available_tools = []

# Initialize Azure OpenAI Client
async def init_openai_client():
    azure_openai_client = None

    try:
        # API version check
        if (
            app_settings.azure_openai.preview_api_version
            < MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION
        ):
            raise ValueError(
                f"The minimum supported Azure OpenAI preview API version is '{MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION}'"
            )

        # Endpoint
        if (
            not app_settings.azure_openai.endpoint and
            not app_settings.azure_openai.resource
        ):
            raise ValueError(
                "AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_RESOURCE is required"
            )

        endpoint = (
            app_settings.azure_openai.endpoint
            if app_settings.azure_openai.endpoint
            else f"https://{app_settings.azure_openai.resource}.openai.azure.com/"
        )

        # Authentication
        # Use .get() method for safer access in case key attribute doesn't exist
        aoai_api_key = getattr(app_settings.azure_openai, 'key', None)
        ad_token_provider = None
        if not aoai_api_key:
            logging.info("No AZURE_OPENAI_KEY found, attempting Azure Entra ID auth")
            # Use DefaultAzureCredential V2 which doesn't require async context manager
            try:
                credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)
                ad_token_provider = get_bearer_token_provider(
                    credential,
                    "https://cognitiveservices.azure.com/.default"
                )
                logging.info("Azure Entra ID credential obtained.")
            except Exception as e:
                logging.error(f"Failed to get Azure Entra ID credential: {e}")
                raise ValueError("Azure Entra ID auth failed, and no API key was provided.")

        # Deployment
        deployment = app_settings.azure_openai.model
        if not deployment:
            raise ValueError("AZURE_OPENAI_MODEL (deployment name) is required")
        logging.info(f"Using Azure OpenAI deployment: {deployment}")

        # Default Headers
        default_headers = {"x-ms-useragent": USER_AGENT}

        # Remote function calls
        if app_settings.azure_openai.function_call_azure_functions_enabled:
            azure_functions_tools_url = f"{app_settings.azure_openai.function_call_azure_functions_tools_base_url}?code={app_settings.azure_openai.function_call_azure_functions_tools_key}"
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(azure_functions_tools_url)
                response.raise_for_status() # Raise exception for bad status codes
                azure_openai_tools.extend(json.loads(response.text))
                for tool in azure_openai_tools:
                    azure_openai_available_tools.append(tool["function"]["name"])
                logging.info(f"Loaded {len(azure_openai_tools)} tools from Azure Functions.")
            except Exception as e:
                logging.error(f"An error occurred while getting OpenAI Function Call tools metadata: {e}")


        azure_openai_client = AsyncAzureOpenAI(
            api_version=app_settings.azure_openai.preview_api_version,
            api_key=aoai_api_key,
            azure_ad_token_provider=ad_token_provider,
            default_headers=default_headers,
            azure_endpoint=endpoint,
        )
        logging.info(f"Azure OpenAI client configured for endpoint: {endpoint}")
        return azure_openai_client
    except Exception as e:
        logging.exception("Exception during Azure OpenAI client initialization")
        azure_openai_client = None
        raise e

async def openai_remote_azure_function_call(function_name, function_args):
    if app_settings.azure_openai.function_call_azure_functions_enabled is not True:
        logging.warning("Attempted remote function call, but feature is disabled.")
        return None # Return None or raise an error

    azure_functions_tool_url = f"{app_settings.azure_openai.function_call_azure_functions_tool_base_url}?code={app_settings.azure_openai.function_call_azure_functions_tool_key}"
    headers = {'content-type': 'application/json'}
    try:
        # Ensure arguments are valid JSON before sending
        parsed_args = json.loads(function_args)
        body = {
            "tool_name": function_name,
            "tool_arguments": parsed_args
        }
        async with httpx.AsyncClient() as client:
            logging.debug(f"Calling Azure Function tool: {function_name}")
            response = await client.post(azure_functions_tool_url, data=json.dumps(body), headers=headers)
        response.raise_for_status()
        logging.debug(f"Azure Function tool response: {response.text}")
        return response.text
    except json.JSONDecodeError as e:
         logging.error(f"Failed to parse function arguments as JSON: {function_args} - Error: {e}")
         return json.dumps({"error": f"Invalid arguments format: {e}"})
    except Exception as e:
        logging.error(f"Error calling Azure Function tool {function_name}: {e}")
        return json.dumps({"error": f"Failed to execute tool {function_name}: {e}"})

async def init_cosmosdb_client():
    cosmos_conversation_client = None
    # FIX: Use getattr to safely check for 'enabled' attribute, default to False
    if app_settings.chat_history and getattr(app_settings.chat_history, 'enabled', False):
        logging.info("Chat history is enabled. Initializing CosmosDB client...")
        try:
            cosmos_endpoint = (
                f"https://{app_settings.chat_history.account}.documents.azure.com:443/"
            )

            # Use DefaultAzureCredential V2 which doesn't require async context manager
            if not app_settings.chat_history.account_key:
                logging.info("Using Azure Entra ID for CosmosDB authentication.")
                credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)
            else:
                logging.info("Using CosmosDB account key for authentication.")
                credential = app_settings.chat_history.account_key

            cosmos_conversation_client = CosmosConversationClient(
                cosmosdb_endpoint=cosmos_endpoint,
                credential=credential,
                database_name=app_settings.chat_history.database,
                container_name=app_settings.chat_history.conversations_container,
                enable_message_feedback=getattr(app_settings.chat_history, 'enable_feedback', False), # Also fix here
            )
            # Ensure DB and container exist
            success, err = await cosmos_conversation_client.ensure()
            if not success:
                 logging.error(f"Failed to ensure CosmosDB setup: {err}")
                 raise Exception(f"CosmosDB setup failed: {err}")
            logging.info("CosmosDB client initialized and schema ensured.")
        except Exception as e:
            logging.exception("Exception during CosmosDB initialization")
            cosmos_conversation_client = None
            raise e # Rethrow to prevent app from starting in a bad state if DB required
    else:
        logging.info("Chat history not configured or disabled.")

    return cosmos_conversation_client


def prepare_model_args(request_body, request_headers):
    request_messages = request_body.get("messages", [])
    messages = []
    # Add system message only if not using On Your Data (OYD)
    if not app_settings.datasource:
        messages.append(
            {
                "role": "system",
                "content": app_settings.azure_openai.system_message
            }
        )
        logging.debug(f"Prepended system message: {app_settings.azure_openai.system_message}")

    # Filter and format messages from request
    for message in request_messages:
        if message and isinstance(message, dict) and "role" in message and "content" in message:
            role = message["role"]
            content = message["content"]

            if role == "user":
                 messages.append({"role": role, "content": content})
            elif role in ["assistant", "function", "tool"]:
                 msg_helper = {"role": role, "content": content}
                 # Include other relevant fields if present
                 if "name" in message:
                     msg_helper["name"] = message["name"]
                 if "function_call" in message:
                     msg_helper["function_call"] = message["function_call"]
                 if "context" in message and message["context"] is not None:
                     try:
                         # Ensure context is treated as an object if provided
                         context_obj = json.loads(message["context"]) if isinstance(message["context"], str) else message["context"]
                         msg_helper["context"] = context_obj
                     except (json.JSONDecodeError, TypeError) as e:
                         logging.warning(f"Could not parse message context: {message.get('context')} - Error: {e}")
                 if "id" in message: # Pass assistant message ID if available
                      msg_helper["id"] = message
