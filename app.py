import copy
import json
import os
import logging
import uuid
import httpx
import asyncio
import datetime  # Added for SAS token expiry

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
from quart_cors import cors  # <<< --- NEW IMPORT TO FIX CORS

from openai import AsyncAzureOpenAI
from azure.identity.aio import (
    DefaultAzureCredential,
    get_bearer_token_provider
)
# --- ADD BLOB STORAGE IMPORTS ---
from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob import generate_blob_sas, BlobSasPermissions
# --- END BLOB STORAGE IMPORTS ---

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

    # === NEW CORS CONFIGURATION ===
    # This handles the OPTIONS preflight request and fixes the 405 error
    app = cors(app, allow_origin="https://white-stone-09b65ea1e.3.azurestaticapps.net", allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT"], allow_headers=["*"])
    # === END NEW CORS CONFIGURATION ===

    app.register_blueprint(bp)
    app.config["TEMPLATES_AUTO_RELOAD"] = True

    # Explicitly serve index.html for the root path '/'
    # This might be redundant given static_url_path='/', but ensures it works
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
            # Decide if you want the app to fail startup if DB isn't ready
            # raise e

    return app

# --- Serve Static Files ---
# NOTE: If static_url_path='/' works, these might not be strictly necessary,
# but they ensure the files are served correctly.
@bp.route("/")
async def serve_index():
    return await send_from_directory("static", "index.html")

@bp.route("/script.js")
async def serve_script():
    return await send_from_directory("static", "script.js")

@bp.route("/style.css")
async def serve_style():
    return await send_from_directory("static", "style.css")

@bp.route("/favicon.ico")
async def favicon():
    # Assuming favicon is directly in the static folder
    return await bp.send_static_file("favicon.ico")

@bp.route("/assets/<path:path>")
async def assets(path):
    # Serves files from static/assets directory
    return await send_from_directory("static/assets", path)


# Debug settings
DEBUG = os.environ.get("DEBUG", "false")
if DEBUG.lower() == "true":
    logging.basicConfig(level=logging.DEBUG)

USER_AGENT = "GitHubSampleWebApp/AsyncAzureOpenAI/1.0.0"


# Frontend Settings via Environment Variables
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

        # Use the specific endpoint if provided, otherwise construct it
        endpoint = app_settings.azure_openai.endpoint or f"https://{app_settings.azure_openai.resource}.openai.azure.com/"

        # Authentication
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


        # Deployment
        deployment = app_settings.azure_openai.model
        if not deployment:
            raise ValueError("AZURE_OPENAI_MODEL deployment name is required")

        # Default Headers
        default_headers = {"x-ms-useragent": USER_AGENT}

        # Remote function calls (if configured) - Assuming this part is correct as is
        if app_settings.azure_openai.function_call_azure_functions_enabled:
            # ... (your existing function call setup code) ...
            pass # Placeholder if no changes needed

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

# --- Your existing openai_remote_azure_function_call function ---
async def openai_remote_azure_function_call(function_name, function_args):
    # ... (Keep your existing implementation) ...
    pass # Placeholder

# --- Your existing init_cosmosdb_client function ---
async def init_cosmosdb_client():
    cosmos_conversation_client = None
    if app_settings.chat_history:
        logging.info("Chat history is enabled, attempting to initialize CosmosDB client.")
        try:
            # Construct endpoint from account name
            cosmos_endpoint = f"https://{app_settings.chat_history.account}.documents.azure.com:443/"
            logging.info(f"Cosmos DB endpoint: {cosmos_endpoint}")
            logging.info(f"Cosmos DB database: {app_settings.chat_history.database}")
            logging.info(f"Cosmos DB container: {app_settings.chat_history.conversations_container}")

            credential = None
            if not app_settings.chat_history.account_key:
                logging.info("No Cosmos DB account key found, attempting Azure Entra ID auth using DefaultAzureCredential.")
                # Ensure DefaultAzureCredential() has time to initialize properly if needed outside 'with'
                # Note: Using DefaultAzureCredential directly might be simpler if the SDK supports it
                async with DefaultAzureCredential() as cred:
                    # Depending on CosmosConversationClient, you might pass the credential object
                    # or need to get a token first. Assuming it takes the credential object.
                    credential = cred
                    logging.info("Using DefaultAzureCredential for Cosmos DB.")
            else:
                logging.debug("Using Cosmos DB account key for authentication.")
                credential = app_settings.chat_history.account_key

            # Validate required settings before initializing client
            if not app_settings.chat_history.database:
                raise ValueError("CosmosDB database name is required but not configured.")
            if not app_settings.chat_history.conversations_container:
                 raise ValueError("CosmosDB container name is required but not configured.")


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
            # Consider if the app should raise or just log and continue without history
            raise e # Reraise to potentially stop startup if DB is critical
    else:
        logging.warning("Chat history is not configured. Chat history will not be saved.")

    return cosmos_conversation_client


# --- Your existing prepare_model_args function ---
def prepare_model_args(request_body, request_headers):
    # ... (Keep your existing implementation) ...
    # Make sure this function correctly handles messages, tools, datasources etc.
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
                        # Assuming context is already an object or None from the request
                        messages_helper["context"] = message["context"]
                    
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
        # Cleanse datasource parameters
        if "data_sources" in model_args_clean["extra_body"]:
            for ds in model_args_clean["extra_body"]["data_sources"]:
                if "parameters" in ds:
                    for secret_param in secret_params:
                        if ds["parameters"].get(secret_param):
                            ds["parameters"][secret_param] = "*****"
                    # Cleanse authentication
                    authentication = ds["parameters"].get("authentication", {})
                    for field in authentication:
                        if field in secret_params:
                            authentication[field] = "*****"
                    # Cleanse embedding dependency
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


# --- Your existing promptflow_request function ---
async def promptflow_request(request):
    # ... (Keep your existing implementation) ...
    pass # Placeholder


# --- Your existing process_function_call function ---
async def process_function_call(response):
    # ... (Keep your existing implementation) ...
    pass # Placeholder


# --- Your existing send_chat_request function ---
async def send_chat_request(request_body, request_headers):
    # Ensure this calls init_openai_client() and handles exceptions
    try:
        azure_openai_client = await init_openai_client()
        if not azure_openai_client:
             raise Exception("Azure OpenAI client failed to initialize.")
        model_args = prepare_model_args(request_body, request_headers) # Get prepared args
        logging.debug(f"Sending request to OpenAI with args: {json.dumps(model_args, default=str)}") # Use default=str for logging complex objects
        raw_response = await azure_openai_client.chat.completions.with_raw_response.create(**model_args)
        response = raw_response.parse()
        apim_request_id = raw_response.headers.get("apim-request-id")
        return response, apim_request_id
    except Exception as e:
        logging.exception("Exception in send_chat_request", exc_info=e)
        raise e


# --- Your existing complete_chat_request function ---
async def complete_chat_request(request_body, request_headers):
    # This should call send_chat_request or promptflow_request
     if app_settings.base_settings.use_promptflow:
          # ... (promptflow logic) ...
          pass
     else:
          response, apim_request_id = await send_chat_request(request_body, request_headers)
          history_metadata = request_body.get("history_metadata", {})
          non_streaming_response = format_non_streaming_response(response, history_metadata, apim_request_id)
          
          if app_settings.azure_openai.function_call_azure_functions_enabled:
              function_response = await process_function_call(response)  # Add await here
              if function_response:
                  request_body["messages"].extend(function_response)
                  # Make a second call for the final response
                  response, apim_request_id = await send_chat_request(request_body, request_headers)
                  history_metadata = request_body.get("history_metadata", {})
                  non_streaming_response = format_non_streaming_response(response, history_metadata, apim_request_id)

          return non_streaming_response


# --- Your existing AzureOpenaiFunctionCallStreamState class ---
class AzureOpenaiFunctionCallStreamState():
    def __init__(self):
        self.tool_calls = []              # All tool calls detected in the stream
        self.tool_name = ""               # Tool name being streamed
        self.tool_arguments_stream = ""   # Tool arguments being streamed
        self.current_tool_call = None     # JSON with the tool name and arguments currently being streamed
        self.function_messages = []       # All function messages to be appended to the chat history
        self.streaming_state = "INITIAL"  # Streaming state (INITIAL, STREAMING, COMPLETED)


# --- Your existing process_function_call_stream function ---
async def process_function_call_stream(completionChunk, function_call_stream_state, request_body, request_headers, history_metadata, apim_request_id):
    # ... (Keep your existing implementation) ...
    pass # Placeholder


# --- Your existing stream_chat_request function ---
async def stream_chat_request(request_body, request_headers):
    # This should call send_chat_request
    response, apim_request_id = await send_chat_request(request_body, request_headers)
    history_metadata = request_body.get("history_metadata", {})
    
    async def generate(apim_request_id, history_metadata):
        # (Existing streaming and function call logic)
        if app_settings.azure_openai.function_call_azure_functions_enabled:
             # ... (your existing function call streaming logic) ...
             pass
        else:
            # Standard streaming
            async for completionChunk in response:
                yield format_stream_response(completionChunk, history_metadata, apim_request_id)

    return generate(apim_request_id=apim_request_id, history_metadata=history_metadata)

# --- Your existing conversation_internal function ---
async def conversation_internal(request_body, request_headers):
    try:
        if app_settings.azure_openai.stream and not app_settings.base_settings.use_promptflow:
            result = await stream_chat_request(request_body, request_headers)
            response = await make_response(format_as_ndjson(result))
            response.timeout = None # Keep connection open for streaming
            response.mimetype = "application/json-lines"
            return response
        else:
            result = await complete_chat_request(request_body, request_headers)
            return jsonify(result)

    except Exception as ex:
        logging.exception("Exception in conversation_internal", exc_info=ex)
        status_code = getattr(ex, "status_code", 500) # Default to 500 if no specific code
        return jsonify({"error": str(ex)}), status_code


# --- Your existing conversation route ---
@bp.route("/conversation", methods=["POST"])
async def conversation():
    if not request.is_json:
        return jsonify({"error": "request must be json"}), 415
    request_json = await request.get_json()
    return await conversation_internal(request_json, request.headers)


# --- Your existing frontend_settings route ---
@bp.route("/frontend_settings", methods=["GET"])
def get_frontend_settings():
     try:
         return jsonify(frontend_settings), 200
     except Exception as e:
         logging.exception("Exception in /frontend_settings", exc_info=e)
         return jsonify({"error": str(e)}), 500


# === NEW ROUTE FOR FILE UPLOAD SAS URL ===
@bp.route("/api/get-upload-url", methods=["POST"]) # Already accepts POST, OPTIONS handled by quart-cors
async def get_upload_url():
    request_body = await request.get_json()
    file_name = request_body.get("fileName")

    if not file_name:
        logging.warning("get_upload_url called without fileName.")
        return jsonify({"error": "fileName is required"}), 400

    storage_connection_string = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
    if not storage_connection_string:
        logging.error("AZURE_STORAGE_CONNECTION_STRING is not set in environment variables.")
        return jsonify({"error": "Azure Storage connection string not configured"}), 500

    # Define container name (ensure this container exists in your glgaistorage)
    container_name = "uploads" # You can make this configurable via env var if needed

    blob_service_client = None # Define outside try block for cleanup
    try:
        logging.info(f"Generating SAS URL for: {container_name}/{file_name}")
        # Create the BlobServiceClient object asynchronously
        blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)

        # Generate SAS token
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=container_name,
            blob_name=file_name, # Use the client's filename for the blob
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(create=True, write=True), # Permissions needed for upload
            expiry=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10) # Extended expiry slightly
        )

        # Construct the full SAS URL for the blob
        sas_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{file_name}?{sas_token}"

        # Construct the final blob URL (without SAS token) for reference by the backend/AI
        blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{file_name}"

        logging.info(f"Successfully generated SAS URL for {file_name}")
        return jsonify({"sasUrl": sas_url, "blobUrl": blob_url})

    except Exception as e:
        logging.exception("Failed to generate SAS URL", exc_info=e)
        return jsonify({"error": f"Failed to generate upload URL: {str(e)}"}), 500
    finally:
        # Ensure the async client is closed
        if blob_service_client:
            await blob_service_client.close()
# === END OF NEW ROUTE ===


## Conversation History API ##
@bp.route("/history/generate", methods=["POST"])
async def add_conversation():
    await cosmos_db_ready.wait() # Wait for DB client to be ready
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    try:
        # Check if cosmos client initialized properly
        if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
            logging.error("CosmosDB client is not available.")
            # Raise the specific error to match frontend expectation
            raise Exception("CosmosDB is not configured or not working")

        # Create conversation if ID is missing
        history_metadata = {}
        if not conversation_id:
            logging.info(f"No conversation_id provided, creating new conversation for user {user_id}")
            # Generate title for new conversation
            title = await generate_title(request_json["messages"])
            logging.info(f"Generated title for new conversation: {title}")
            conversation_dict = await current_app.cosmos_conversation_client.create_conversation(
                user_id=user_id, title=title
            )
            conversation_id = conversation_dict["id"]
            history_metadata["title"] = title
            history_metadata["date"] = conversation_dict["createdAt"]
            logging.info(f"Created new conversation with ID: {conversation_id}")
        else:
             logging.info(f"Using existing conversation ID: {conversation_id}")

        # Store the user message in history
        messages = request_json["messages"]
        if len(messages) > 0 and messages[-1]["role"] == "user":
            logging.debug(f"Creating user message entry in conversation {conversation_id}")
            message_to_save = messages[-1]
            # Add a unique ID if the frontend didn't provide one (it should)
            message_uuid = message_to_save.get("id", str(uuid.uuid4()))

            createdMessageValue = await current_app.cosmos_conversation_client.create_message(
                uuid=message_uuid,
                conversation_id=conversation_id,
                user_id=user_id,
                input_message=message_to_save,
            )
            # Simple check, assumes create_message raises exceptions on failure or returns specific string
            if createdMessageValue == "Conversation not found":
                 logging.error(f"Conversation {conversation_id} not found when trying to add message.")
                 raise Exception(f"Conversation not found for the given conversation ID: {conversation_id}.")
            logging.debug(f"User message saved with UUID: {message_uuid}")
        else:
            logging.warning("Request to /history/generate did not contain a user message at the end.")
            # Decide how to handle this - raise error or proceed? For now, proceed.
            # raise Exception("No user message found at the end of the messages list")


        # Prepare request for OpenAI/Promptflow and add history metadata
        request_body = await request.get_json() # Get fresh copy if needed
        history_metadata["conversation_id"] = conversation_id
        request_body["history_metadata"] = history_metadata

        # Call the internal conversation handler to get the AI response
        logging.info("Calling conversation_internal to get AI response.")
        return await conversation_internal(request_body, request.headers)

    except Exception as e:
        logging.exception("Exception in /history/generate", exc_info=e)
        # Return status 500 for generic server errors
        return jsonify({"error": str(e)}), 500


# --- Your existing /history/update route ---
@bp.route("/history/update", methods=["POST"])
async def update_conversation():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
    await cosmos_db_ready.wait()
    if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         return jsonify({"error": "CosmosDB is not configured or not working"}), 500
    # ... rest of your logic
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)
    if not conversation_id:
         return jsonify({"error": "conversation_id is required"}), 400

    messages = request_json["messages"]
    try:
         if len(messages) > 0 and messages[-1]["role"] == "assistant":
              assistant_message = messages[-1]
              # Ensure message has an ID, generate if missing (though frontend should provide)
              message_uuid = assistant_message.get("id", str(uuid.uuid4()))
              assistant_message["id"] = message_uuid # Store the ID back if generated

              # Check for preceding tool message
              if len(messages) > 1 and messages[-2].get("role") == "tool":
                   logging.debug(f"Saving tool message before assistant message in conv {conversation_id}")
                   tool_message = messages[-2]
                   tool_uuid = tool_message.get("id", str(uuid.uuid4()))
                   await current_app.cosmos_conversation_client.create_message(
                       uuid=tool_uuid,
                       conversation_id=conversation_id,
                       user_id=user_id,
                       input_message=tool_message,
                   )

              logging.debug(f"Saving assistant message {message_uuid} in conv {conversation_id}")
              await current_app.cosmos_conversation_client.create_message(
                  uuid=message_uuid, # Use the ID from the assistant message
                  conversation_id=conversation_id,
                  user_id=user_id,
                  input_message=assistant_message,
              )
              return jsonify({"message_id": message_uuid, "status": "Assistant message saved"}), 200
         else:
             logging.warning("Request to /history/update did not contain an assistant message at the end.")
             return jsonify({"error": "No assistant message found to save"}), 400

    except Exception as e:
         logging.exception("Exception in /history/update", exc_info=e)
         return jsonify({"error": str(e)}), 500


# --- Your existing /history/message_feedback route ---
@bp.route("/history/message_feedback", methods=["POST"])
async def update_message():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
    await cosmos_db_ready.wait()
    if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         return jsonify({"error": "CosmosDB is not configured or not working"}), 500
    # ... rest of your logic
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]
    request_json = await request.get_json()
    message_id = request_json.get("message_id", None)
    message_feedback = request_json.get("message_feedback", None)

    if not message_id: return jsonify({"error": "message_id is required"}), 400
    if not message_feedback: return jsonify({"error": "message_feedback is required"}), 400

    try:
         updated_message = await current_app.cosmos_conversation_client.update_message_feedback(
             user_id, message_id, message_feedback
         )
         if updated_message:
              return jsonify({
                  "message": f"Successfully updated message feedback",
                  "message_id": message_id
              }), 200
         else:
              return jsonify({
                  "error": f"Unable to update message {message_id}. Not found or insufficient permissions."
              }), 404
    except Exception as e:
         logging.exception("Exception in /history/message_feedback", exc_info=e)
         return jsonify({"error": str(e)}), 500


# --- Your existing /history/delete route ---
@bp.route("/history/delete", methods=["DELETE"])
async def delete_conversation():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
     await cosmos_db_ready.wait()
     if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         return jsonify({"error": "CosmosDB is not configured or not working"}), 500
    # ... rest of your logic
     authenticated_user = get_authenticated_user_details(request_headers=request.headers)
     user_id = authenticated_user["user_principal_id"]
     request_json = await request.get_json()
     conversation_id = request_json.get("conversation_id", None)
     if not conversation_id: return jsonify({"error": "conversation_id is required"}), 400

     try:
          logging.info(f"Deleting messages for conversation {conversation_id}")
          await current_app.cosmos_conversation_client.delete_messages(conversation_id, user_id)
          logging.info(f"Deleting conversation metadata for {conversation_id}")
          await current_app.cosmos_conversation_client.delete_conversation(user_id, conversation_id)
          return jsonify({
              "message": "Successfully deleted conversation and messages",
              "conversation_id": conversation_id
          }), 200
     except Exception as e:
          logging.exception("Exception in /history/delete", exc_info=e)
          return jsonify({"error": str(e)}), 500


# --- Your existing /history/list route ---
@bp.route("/history/list", methods=["GET"])
async def list_conversations():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
    await cosmos_db_ready.wait()
    if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         return jsonify({"error": "CosmosDB is not configured or not working"}), 500
    # ... rest of your logic
    offset = request.args.get("offset", 0)
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    try:
         conversations = await current_app.cosmos_conversation_client.get_conversations(user_id, offset=offset, limit=25)
         if not isinstance(conversations, list): # Check if the result indicates not found
             # Return empty list instead of 404, more standard for list endpoints
             return jsonify([]), 200
         return jsonify(conversations), 200
    except Exception as e:
         logging.exception("Exception in /history/list", exc_info=e)
         return jsonify({"error": str(e)}), 500


# --- Your existing /history/read route ---
@bp.route("/history/read", methods=["POST"])
async def get_conversation():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
     await cosmos_db_ready.wait()
     if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         return jsonify({"error": "CosmosDB is not configured or not working"}), 500
    # ... rest of your logic
     authenticated_user = get_authenticated_user_details(request_headers=request.headers)
     user_id = authenticated_user["user_principal_id"]
     request_json = await request.get_json()
     conversation_id = request_json.get("conversation_id", None)
     if not conversation_id: return jsonify({"error": "conversation_id is required"}), 400

     try:
          # Get conversation metadata (optional, maybe not needed if just getting messages)
          conversation = await current_app.cosmos_conversation_client.get_conversation(user_id, conversation_id)
          if not conversation:
               return jsonify({"error": f"Conversation {conversation_id} not found or access denied."}), 404

          # Get messages
          conversation_messages = await current_app.cosmos_conversation_client.get_messages(user_id, conversation_id)

          # Format messages for frontend
          messages = [
              {
                  "id": msg.get("id"), # Use .get() for safety
                  "role": msg.get("role"),
                  "content": msg.get("content"),
                  "createdAt": msg.get("createdAt"),
                  "feedback": msg.get("feedback"),
                  # Include other fields if your frontend expects them (like context, citations)
                  "context": msg.get("context")
              }
              for msg in conversation_messages if msg # Ensure msg is not None
          ]
          return jsonify({"conversation_id": conversation_id, "messages": messages}), 200

     except Exception as e:
          logging.exception("Exception in /history/read", exc_info=e)
          return jsonify({"error": str(e)}), 500


# --- Your existing /history/rename route ---
@bp.route("/history/rename", methods=["POST"])
async def rename_conversation():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
     await cosmos_db_ready.wait()
     if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         return jsonify({"error": "CosmosDB is not configured or not working"}), 500
    # ... rest of your logic
     authenticated_user = get_authenticated_user_details(request_headers=request.headers)
     user_id = authenticated_user["user_principal_id"]
     request_json = await request.get_json()
     conversation_id = request_json.get("conversation_id", None)
     title = request_json.get("title", None)

     if not conversation_id: return jsonify({"error": "conversation_id is required"}), 400
     if not title: return jsonify({"error": "title is required"}), 400

     try:
          conversation = await current_app.cosmos_conversation_client.get_conversation(user_id, conversation_id)
          if not conversation:
               return jsonify({"error": f"Conversation {conversation_id} not found or access denied."}), 404

          conversation["title"] = title
          updated_conversation = await current_app.cosmos_conversation_client.upsert_conversation(conversation)
          return jsonify(updated_conversation), 200

     except Exception as e:
          logging.exception("Exception in /history/rename", exc_info=e)
          return jsonify({"error": str(e)}), 500

# --- Your existing /history/delete_all route ---
@bp.route("/history/delete_all", methods=["DELETE"])
async def delete_all_conversations():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
     await cosmos_db_ready.wait()
     if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         return jsonify({"error": "CosmosDB is not configured or not working"}), 500
    # ... rest of your logic
     authenticated_user = get_authenticated_user_details(request_headers=request.headers)
     user_id = authenticated_user["user_principal_id"]

     try:
          conversations = await current_app.cosmos_conversation_client.get_conversations(user_id, offset=0, limit=None) # Get all
          if not conversations:
               return jsonify({"message": f"No conversations found for user {user_id}."}), 200 # Not an error

          deleted_count = 0
          for conversation in conversations:
               conv_id = conversation.get("id")
               if conv_id:
                   logging.info(f"Deleting conversation {conv_id} for user {user_id}")
                   await current_app.cosmos_conversation_client.delete_messages(conv_id, user_id)
                   await current_app.cosmos_conversation_client.delete_conversation(user_id, conv_id)
                   deleted_count += 1

          return jsonify({
              "message": f"Successfully deleted {deleted_count} conversations for user {user_id}"
          }), 200

     except Exception as e:
          logging.exception("Exception in /history/delete_all", exc_info=e)
          return jsonify({"error": str(e)}), 500

# --- Your existing /history/clear route ---
@bp.route("/history/clear", methods=["POST"])
async def clear_messages():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
     await cosmos_db_ready.wait()
     if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         return jsonify({"error": "CosmosDB is not configured or not working"}), 500
    # ... rest of your logic
     authenticated_user = get_authenticated_user_details(request_headers=request.headers)
     user_id = authenticated_user["user_principal_id"]
     request_json = await request.get_json()
     conversation_id = request_json.get("conversation_id", None)
     if not conversation_id: return jsonify({"error": "conversation_id is required"}), 400

     try:
          # Verify conversation exists and user has access before deleting messages (optional but safer)
          # conversation = await current_app.cosmos_conversation_client.get_conversation(user_id, conversation_id)
          # if not conversation:
          #     return jsonify({"error": f"Conversation {conversation_id} not found or access denied."}), 404

          await current_app.cosmos_conversation_client.delete_messages(conversation_id, user_id)
          return jsonify({
              "message": "Successfully deleted messages in conversation",
              "conversation_id": conversation_id
          }), 200
     except Exception as e:
          logging.exception("Exception in /history/clear", exc_info=e) # Corrected path
          return jsonify({"error": str(e)}), 500

# --- Your existing /history/ensure route ---
@bp.route("/history/ensure", methods=["GET"])
async def ensure_cosmos():
    # ... (Keep your existing implementation, ensure cosmos client check) ...
     await cosmos_db_ready.wait() # Wait for initial attempt
     if not app_settings.chat_history:
         return jsonify({"error": "CosmosDB chat history is disabled in settings."}), 404
     if not hasattr(current_app, 'cosmos_conversation_client') or not current_app.cosmos_conversation_client:
         # If client failed init, return specific error if possible, else generic
         # This might require storing the init exception in current_app
         return jsonify({"error": "CosmosDB client failed to initialize. Check logs."}), 500

     # If client exists, try the ensure method
     try:
         # The ensure method might need adjustments depending on its implementation
         success, err_msg = await current_app.cosmos_conversation_client.ensure()
         if success:
             return jsonify({"message": "CosmosDB is configured and accessible."}), 200
         else:
             # Provide more context if possible from err_msg
             logging.error(f"CosmosDB ensure check failed: {err_msg}")
             return jsonify({"error": f"CosmosDB ensure check failed: {err_msg or 'Unknown error'}"}), 500
     except Exception as e:
         logging.exception("Exception during /history/ensure check", exc_info=e)
         cosmos_exception = str(e)
         # Map common exceptions to specific status codes
         if "invalid credentials" in cosmos_exception.lower(): return jsonify({"error": cosmos_exception}), 401
         if "database" in cosmos_exception.lower() and ("not found" in cosmos_exception.lower() or "invalid name" in cosmos_exception.lower()) : return jsonify({"error": f"{cosmos_exception}"}), 422
         if "container" in cosmos_exception.lower() and ("not found" in cosmos_exception.lower() or "invalid name" in cosmos_exception.lower()): return jsonify({"error": f"{cosmos_exception}"}), 422
         return jsonify({"error": f"CosmosDB health check failed: {cosmos_exception}"}), 500


# --- Your existing generate_title function ---
async def generate_title(conversation_messages) -> str:
    # ... (Keep your existing implementation) ...
    # Ensure it calls init_openai_client() correctly
    title_prompt = "Summarize the conversation so far into a 4-word or less title. Do not use any quotation marks or punctuation. Do not include any other commentary or description."

    messages = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in conversation_messages if msg # Filter out potential None values
    ]
    # Check if there are any messages to generate title from
    if not messages:
        return "New Chat" # Default title for empty history

    messages.append({"role": "user", "content": title_prompt})

    try:
        azure_openai_client = await init_openai_client()
        if not azure_openai_client:
            raise Exception("Azure OpenAI client failed to initialize for title generation.")

        response = await azure_openai_client.chat.completions.create(
            model=app_settings.azure_openai.model, # Use configured model
            messages=messages,
            temperature=0.7, # Adjusted temperature slightly
            max_tokens=20 # Reduced tokens for title
        )

        title = response.choices[0].message.content.strip().strip('"').strip("'").strip(".")
        # Basic cleanup, you might need more robust cleaning
        return title if title else "Chat Summary" # Fallback title

    except Exception as e:
        logging.exception("Exception while generating conversation title", exc_info=e)
        # Fallback to using a snippet of the last user message if possible
        user_messages = [m for m in conversation_messages if m and m.get("role") == "user"]
        if user_messages:
            last_user_content = user_messages[-1].get("content", "Chat")
            return last_user_content[:30] + ("..." if len(last_user_content) > 30 else "")
        return "Chat" # Generic fallback


# --- Create the app instance ---
app = create_app()

# Optional: Add entry point for running directly (e.g., python app.py)
# if __name__ == "__main__":
#     app.run(debug=DEBUG.lower() == "true", host="0.0.0.0", port=8000)
