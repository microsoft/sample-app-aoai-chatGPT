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
                # Check if credential is valid before getting token provider
                # A simple check could involve trying to get a token, though this adds latency.
                # For now, we assume it's valid if DefaultAzureCredential doesn't raise immediately.
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
    if app_settings.chat_history and app_settings.chat_history.enabled:
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
                enable_message_feedback=app_settings.chat_history.enable_feedback,
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
                      msg_helper["id"] = message["id"]

                 messages.append(msg_helper)
            else:
                 logging.warning(f"Skipping message with unknown role: {role}")


    # Add Microsoft Defender context if enabled
    user_security_context = None
    if (MS_DEFENDER_ENABLED):
        try:
            authenticated_user_details = get_authenticated_user_details(request_headers)
            application_name = app_settings.ui.title
            user_security_context = get_msdefender_user_json(authenticated_user_details, request_headers, application_name )
        except Exception as e:
            logging.error(f"Failed to get MS Defender context: {e}")

    # Base model arguments
    model_args = {
        "messages": messages,
        "temperature": app_settings.azure_openai.temperature,
        "max_tokens": app_settings.azure_openai.max_tokens,
        "top_p": app_settings.azure_openai.top_p,
        "stop": app_settings.azure_openai.stop_sequence,
        "stream": app_settings.azure_openai.stream,
        "model": app_settings.azure_openai.model # This is the deployment name
    }

    # Add tools or On Your Data (OYD) configuration if applicable
    # Only add these if the last message is from the user
    if messages and messages[-1]["role"] == "user":
        if app_settings.azure_openai.function_call_azure_functions_enabled and azure_openai_tools:
            model_args["tools"] = azure_openai_tools
            logging.debug(f"Adding tools to request: {azure_openai_available_tools}")

        if app_settings.datasource:
            # Construct OYD payload carefully
            try:
                 oyd_payload = app_settings.datasource.construct_payload_configuration(request=request)
                 model_args["extra_body"] = {"data_sources": [oyd_payload]}
                 logging.debug("Adding On Your Data configuration to request.")
            except Exception as e:
                 logging.error(f"Failed to construct OYD payload: {e}")
                 # Decide how to handle OYD failure - maybe remove it or raise error?
                 # For now, let's remove it to allow basic chat to proceed
                 if "extra_body" in model_args: del model_args["extra_body"]

    # --- Sanitize secrets for logging ---
    model_args_clean = copy.deepcopy(model_args)
    if model_args_clean.get("extra_body"):
        secret_params = [
            "key",
            "connection_string",
            "embedding_key",
            "encoded_api_key",
            "api_key", # Ensure this is included
        ]
        # Sanitize data_sources parameters
        if "data_sources" in model_args_clean["extra_body"] and model_args_clean["extra_body"]["data_sources"]:
             ds_params = model_args_clean["extra_body"]["data_sources"][0].get("parameters", {})
             for secret_param in secret_params:
                 if secret_param in ds_params:
                     ds_params[secret_param] = "*****"

             # Sanitize authentication within parameters
             authentication = ds_params.get("authentication", {})
             for field in authentication:
                 if field in secret_params:
                     authentication[field] = "*****"

             # Sanitize embeddingDependency authentication
             embeddingDependency = ds_params.get("embedding_dependency", {})
             if "authentication" in embeddingDependency:
                 # Ensure embeddingDependency["authentication"] is a dict
                 if isinstance(embeddingDependency["authentication"], dict):
                     for field in embeddingDependency["authentication"]:
                         if field in secret_params:
                             embeddingDependency["authentication"][field] = "*****"
                 else:
                      logging.warning("embeddingDependency authentication is not a dictionary, cannot sanitize.")

    # Ensure extra_body exists before adding user context
    if model_args.get("extra_body") is None:
         model_args["extra_body"] = {}

    # Add user security context if available
    if user_security_context:
        model_args["extra_body"]["user_security_context"]= user_security_context.to_dict()
        logging.debug("Added user_security_context to request extra_body.")

    # Log the sanitized request body
    logging.debug(f"REQUEST BODY (Sanitized): {json.dumps(model_args_clean, indent=2)}")

    return model_args

# --- Remaining functions (promptflow_request, process_function_call, etc.) ---
# --- Keep them as they were, assuming they don't need changes for static UI ---

async def promptflow_request(request):
    # (Keep original implementation)
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {app_settings.promptflow.api_key}",
        }
        logging.debug(f"Setting PromptFlow timeout to {app_settings.promptflow.response_timeout}")
        async with httpx.AsyncClient(
            timeout=float(app_settings.promptflow.response_timeout)
        ) as client:
            pf_formatted_obj = convert_to_pf_format(
                request,
                app_settings.promptflow.request_field_name,
                app_settings.promptflow.response_field_name
            )
            logging.debug(f"Sending request to PromptFlow endpoint: {app_settings.promptflow.endpoint}")
            response = await client.post(
                app_settings.promptflow.endpoint,
                json={
                    app_settings.promptflow.request_field_name: pf_formatted_obj[-1]["inputs"][app_settings.promptflow.request_field_name],
                    "chat_history": pf_formatted_obj[:-1],
                },
                headers=headers,
            )
        response.raise_for_status() # Raise exception for bad status codes
        resp = response.json()
        resp["id"] = request["messages"][-1]["id"] # Assume last message has ID
        logging.debug(f"Received response from PromptFlow: {resp}")
        return resp
    except Exception as e:
        logging.exception(f"An error occurred while making promptflow_request")
        # Return an error structure that the frontend might understand
        return {"error": f"PromptFlow request failed: {e}"}


async def process_function_call(response):
    # (Keep original implementation, check for None safety)
    if not response.choices or not response.choices[0].message:
         return None
    response_message = response.choices[0].message
    messages = []

    if response_message.tool_calls:
        logging.info(f"Processing {len(response_message.tool_calls)} tool calls.")
        for tool_call in response_message.tool_calls:
            function_name = getattr(tool_call.function, 'name', None)
            function_args = getattr(tool_call.function, 'arguments', None)
            tool_id = getattr(tool_call, 'id', None)

            if not function_name or function_args is None or tool_id is None:
                 logging.warning(f"Skipping incomplete tool call: {tool_call}")
                 continue

            if function_name not in azure_openai_available_tools:
                logging.warning(f"Function {function_name} not available.")
                continue

            function_response = await openai_remote_azure_function_call(function_name, function_args)

            # adding assistant thinking for tool call
            messages.append(
                {
                    "role": "assistant", # Use 'assistant' role for the thinking part
                    "tool_calls": [{ # Match OpenAI spec structure
                         "id": tool_id,
                         "type": "function",
                         "function": {
                             "name": function_name,
                             "arguments": function_args,
                         }
                    }],
                    "content": None, # Important: content must be None when tool_calls is present
                }
            )

            # adding function execution result
            messages.append(
                {
                    "role": "tool", # Use 'tool' role for the result
                    "tool_call_id": tool_id,
                    "content": function_response,
                }
            )
        return messages
    else:
         logging.debug("No tool calls detected in response.")
         return None

async def send_chat_request(request_body, request_headers):
    # (Keep original implementation, add more logging)
    # Ensure messages key exists and is a list
    messages_in = request_body.get("messages", [])
    if not isinstance(messages_in, list):
         logging.error("Invalid 'messages' format in request body.")
         raise ValueError("Invalid 'messages' format")

    filtered_messages = [msg for msg in messages_in if isinstance(msg, dict) and msg.get("role") != 'tool']

    request_body['messages'] = filtered_messages
    model_args = prepare_model_args(request_body, request_headers)

    try:
        azure_openai_client = await init_openai_client()
        if not azure_openai_client:
            raise Exception("Azure OpenAI client is not initialized.")

        logging.info(f"Sending request to Azure OpenAI model: {model_args.get('model')}")
        raw_response = await azure_openai_client.chat.completions.with_raw_response.create(**model_args)
        response = raw_response.parse()
        apim_request_id = raw_response.headers.get("apim-request-id")
        logging.info(f"Received response from Azure OpenAI. APIM Request ID: {apim_request_id}")

    except Exception as e:
        logging.exception("Exception occurred during send_chat_request")
        raise e

    return response, apim_request_id


async def complete_chat_request(request_body, request_headers):
    # (Keep original implementation)
    if app_settings.base_settings.use_promptflow:
        logging.info("Using PromptFlow for chat completion.")
        response = await promptflow_request(request_body)
        history_metadata = request_body.get("history_metadata", {})
        # Check if response indicates an error
        if isinstance(response, dict) and "error" in response:
             # Propagate the error in a format the frontend expects
             return {"error": response["error"]}
        return format_pf_non_streaming_response(
            response,
            history_metadata,
            app_settings.promptflow.response_field_name,
            app_settings.promptflow.citations_field_name
        )
    else:
        logging.info("Using Azure OpenAI for chat completion.")
        response, apim_request_id = await send_chat_request(request_body, request_headers)
        history_metadata = request_body.get("history_metadata", {})
        non_streaming_response = format_non_streaming_response(response, history_metadata, apim_request_id)

        # Handle potential function calls after the initial response
        if app_settings.azure_openai.function_call_azure_functions_enabled:
            logging.debug("Checking for function calls in response.")
            function_messages = await process_function_call(response)

            if function_messages:
                logging.info(f"Function calls detected, sending {len(function_messages)} messages back to model.")
                # Append the assistant's thinking and the tool's result to the history
                request_body["messages"].extend(function_messages)
                # Send the updated history back to the model
                response, apim_request_id = await send_chat_request(request_body, request_headers)
                # Format the final response
                non_streaming_response = format_non_streaming_response(response, history_metadata, apim_request_id)

    return non_streaming_response

class AzureOpenaiFunctionCallStreamState():
     # (Keep original implementation)
    def __init__(self):
        self.tool_calls = []
        self.current_tool_call_index = -1 # Track index for current tool call processing
        self.current_tool_call = None
        self.function_messages = []
        self.streaming_state = "INITIAL"


async def process_function_call_stream(chunk, state):
    # (Improved logic based on OpenAI streaming format for tool calls)
    if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.tool_calls:
        state.streaming_state = "STREAMING_TOOL_CALL"
        for tool_call_chunk in chunk.choices[0].delta.tool_calls:
            # Starting a new tool call
            if tool_call_chunk.index > state.current_tool_call_index:
                # Store the previous complete tool call if exists
                if state.current_tool_call:
                     state.tool_calls.append(state.current_tool_call)

                state.current_tool_call_index = tool_call_chunk.index
                state.current_tool_call = {
                     "id": tool_call_chunk.id or "", # ID might come first
                     "type": "function",
                     "function": {
                         "name": tool_call_chunk.function.name or "",
                         "arguments": tool_call_chunk.function.arguments or ""
                     }
                }
            # Continuing an existing tool call
            else:
                if not state.current_tool_call: # Should not happen if index logic is right
                     logging.error("Streaming error: Received tool chunk without current tool call.")
                     continue
                if tool_call_chunk.id: state.current_tool_call["id"] = tool_call_chunk.id
                if tool_call_chunk.function.name: state.current_tool_call["function"]["name"] += tool_call_chunk.function.name
                if tool_call_chunk.function.arguments: state.current_tool_call["function"]["arguments"] += tool_call_chunk.function.arguments

    # Check if streaming of tool calls is finished (indicated by finish_reason or content)
    if state.streaming_state == "STREAMING_TOOL_CALL" and (chunk.choices[0].finish_reason or chunk.choices[0].delta.content):
        # Store the last complete tool call
        if state.current_tool_call:
             state.tool_calls.append(state.current_tool_call)
        state.current_tool_call = None
        state.current_tool_call_index = -1

        logging.info(f"Finished streaming {len(state.tool_calls)} tool calls. Executing...")
        # Execute all gathered tool calls
        for tool_call in state.tool_calls:
             function_name = tool_call.get("function", {}).get("name")
             function_args = tool_call.get("function", {}).get("arguments")
             tool_id = tool_call.get("id")

             if not function_name or function_args is None or not tool_id:
                  logging.warning(f"Skipping execution of invalid tool call: {tool_call}")
                  continue

             if function_name not in azure_openai_available_tools:
                 logging.warning(f"Function {function_name} not available for execution.")
                 # Add a message indicating the tool wasn't found?
                 state.function_messages.append({
                     "role": "tool",
                     "tool_call_id": tool_id,
                     "content": f"Error: Tool '{function_name}' not found or not available."
                 })
                 continue

             tool_response = await openai_remote_azure_function_call(function_name, function_args)

             # Add assistant thinking message (needed for history)
             state.function_messages.append({
                 "role": "assistant",
                 "tool_calls": [tool_call], # Use the full tool_call structure
                 "content": None
             })
             # Add tool execution result message
             state.function_messages.append({
                 "role": "tool",
                 "tool_call_id": tool_id,
                 "content": tool_response,
             })

        state.streaming_state = "COMPLETED_TOOL_CALL"
        logging.info("Tool call execution finished. Ready for final response stream.")
        return state.streaming_state

    # Continue streaming tool call arguments or initial assistant response
    return state.streaming_state


async def stream_chat_request(request_body, request_headers):
    # (Modified for improved tool call streaming)
    response_stream, apim_request_id = await send_chat_request(request_body, request_headers)
    history_metadata = request_body.get("history_metadata", {})

    async def generate(original_request_body, apim_request_id, history_metadata):
        tool_call_state = AzureOpenaiFunctionCallStreamState()
        final_stream_started = False

        async for chunk in response_stream:
            stream_state = await process_function_call_stream(chunk, tool_call_state)

            # If it's the initial stream and potentially content before tool calls
            if stream_state == "INITIAL":
                 yield format_stream_response(chunk, history_metadata, apim_request_id)

            # If tool call streaming finished, and we need to send results back
            elif stream_state == "COMPLETED_TOOL_CALL":
                logging.info("Tool calls processed, sending results back to model.")
                # Append original assistant thinking + tool results to messages
                new_request_body = copy.deepcopy(original_request_body)
                new_request_body["messages"].extend(tool_call_state.function_messages)

                # Send request again to get the final answer based on tool results
                # Ensure this second request is NOT set to stream if the original wasn't
                # However, our parent function assumes streaming, so we stream the result.
                final_response_stream, final_apim_request_id = await send_chat_request(new_request_body, request_headers)

                # Stream the final response
                async for final_chunk in final_response_stream:
                     final_stream_started = True
                     yield format_stream_response(final_chunk, history_metadata, final_apim_request_id or apim_request_id)
                break # Exit the outer loop once final stream is done

            # If actively streaming tool calls, don't yield anything yet
            elif stream_state == "STREAMING_TOOL_CALL":
                 pass # Wait until tool calls finish streaming

        # Handle case where no tool calls happened and initial stream finished
        if tool_call_state.streaming_state == "INITIAL" and not final_stream_started:
             logging.debug("Stream finished without tool calls.")
             # The loop already yielded everything in this case.

    # Pass the original request body to the generator
    return generate(original_request_body=request_body, apim_request_id=apim_request_id, history_metadata=history_metadata)


async def conversation_internal(request_body, request_headers):
    # (Keep original logic, just ensure stream_chat_request handles tool calls)
    try:
        if app_settings.azure_openai.stream and not app_settings.base_settings.use_promptflow:
            logging.info("Processing streaming request.")
            result_stream = await stream_chat_request(request_body, request_headers)
            response = await make_response(format_as_ndjson(result_stream))
            response.timeout = None # Keep connection open for streaming
            response.mimetype = "application/json-lines"
            return response
        else:
            logging.info("Processing non-streaming request.")
            result = await complete_chat_request(request_body, request_headers)
            # Check for errors returned from complete_chat_request
            if isinstance(result, dict) and "error" in result:
                 logging.error(f"Non-streaming request failed: {result['error']}")
                 return jsonify(result), 500 # Or appropriate error code
            return jsonify(result)

    except Exception as ex:
        logging.exception("Unhandled exception in /conversation endpoint")
        # Attempt to return a JSON error response
        error_msg = f"An unexpected error occurred: {ex}"
        status_code = getattr(ex, "status_code", 500)
        return jsonify({"error": error_msg}), status_code


@bp.route("/conversation", methods=["POST"])
async def conversation():
    # (Keep original implementation)
    if not request.is_json:
        return jsonify({"error": "request must be json"}), 415
    try:
        request_json = await request.get_json()
        if not request_json:
             return jsonify({"error": "request body cannot be empty json"}), 400
    except Exception as e:
        logging.error(f"Failed to parse request JSON: {e}")
        return jsonify({"error": f"Invalid JSON in request body: {e}"}), 400

    return await conversation_internal(request_json, request.headers)


@bp.route("/frontend_settings", methods=["GET"])
def get_frontend_settings():
    # (Keep original implementation)
    try:
        return jsonify(frontend_settings), 200
    except Exception as e:
        logging.exception("Exception in /frontend_settings")
        return jsonify({"error": str(e)}), 500


# --- Conversation History API ---
# (Keep original implementations for history routes, ensure error handling)

@bp.route("/history/generate", methods=["POST"])
async def add_conversation():
    await cosmos_db_ready.wait() # Ensure DB client ready
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    # Check if user details are valid
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        request_json = await request.get_json()
        if not request_json:
             return jsonify({"error": "request body cannot be empty json"}), 400
    except Exception as e:
        logging.error(f"Failed to parse request JSON in /history/generate: {e}")
        return jsonify({"error": f"Invalid JSON in request body: {e}"}), 400

    conversation_id = request_json.get("conversation_id", None)

    try:
        if not current_app.cosmos_conversation_client:
            logging.error("CosmosDB client not available in /history/generate")
            raise Exception("CosmosDB is not configured or not working")

        history_metadata = {}
        messages = request_json.get("messages", [])
        if not messages or messages[-1].get("role") != "user":
            raise Exception("Invalid or missing user message in request")

        if not conversation_id:
            logging.info(f"No conversation_id provided, creating new conversation for user {user_id}")
            title = await generate_title(messages)
            conversation_dict = await current_app.cosmos_conversation_client.create_conversation(
                user_id=user_id, title=title
            )
            conversation_id = conversation_dict["id"]
            history_metadata["title"] = title
            history_metadata["date"] = conversation_dict["createdAt"]
            logging.info(f"Created new conversation with ID: {conversation_id}")
        else:
             logging.info(f"Using existing conversation ID: {conversation_id}")

        createdMessageValue = await current_app.cosmos_conversation_client.create_message(
            uuid=str(uuid.uuid4()), # Generate new UUID for the user message entry
            conversation_id=conversation_id,
            user_id=user_id,
            input_message=messages[-1], # Store the last message (user input)
        )
        if createdMessageValue == "Conversation not found":
            logging.error(f"Conversation {conversation_id} not found when trying to add message.")
            raise Exception(f"Conversation not found: {conversation_id}")

        history_metadata["conversation_id"] = conversation_id
        request_json["history_metadata"] = history_metadata # Add metadata for conversation_internal

        # Call internal conversation handler to get model response
        return await conversation_internal(request_json, request.headers)

    except Exception as e:
        logging.exception("Exception in /history/generate")
        return jsonify({"error": str(e)}), 500

# (Keep remaining history routes: update, message_feedback, delete, list, read, rename, delete_all, clear, ensure)
# (Keep generate_title function)

@bp.route("/history/update", methods=["POST"])
async def update_conversation():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        request_json = await request.get_json()
        if not request_json:
             return jsonify({"error": "request body cannot be empty json"}), 400
    except Exception as e:
        logging.error(f"Failed to parse request JSON in /history/update: {e}")
        return jsonify({"error": f"Invalid JSON in request body: {e}"}), 400

    conversation_id = request_json.get("conversation_id", None)

    try:
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/update")
             raise Exception("CosmosDB is not configured or not working")
        if not conversation_id:
            raise Exception("conversation_id is required in request body")

        messages = request_json.get("messages", [])
        # Expecting the last message to be from assistant, potentially preceded by tool messages
        if messages and messages[-1].get("role") == "assistant":
            assistant_message = messages[-1]
            # Check for preceding tool/function messages if functions were called
            if len(messages) > 1 and messages[-2].get("role") in ["tool", "function"]:
                 # Write the tool/function message first
                 await current_app.cosmos_conversation_client.create_message(
                     uuid=str(uuid.uuid4()), # Generate new UUID for tool message entry
                     conversation_id=conversation_id,
                     user_id=user_id,
                     input_message=messages[-2],
                 )
                 logging.debug(f"Saved tool/function message to conversation {conversation_id}")

            # Write the assistant message (use ID from response if available)
            assistant_uuid = assistant_message.get("id", str(uuid.uuid4()))
            await current_app.cosmos_conversation_client.create_message(
                uuid=assistant_uuid,
                conversation_id=conversation_id,
                user_id=user_id,
                input_message=assistant_message,
            )
            logging.info(f"Saved assistant message {assistant_uuid} to conversation {conversation_id}")
        else:
            logging.warning("No assistant message found at the end of messages array in /history/update")
            raise Exception("No valid assistant message found to update history")

        return jsonify({"success": True}), 200

    except Exception as e:
        logging.exception("Exception in /history/update")
        return jsonify({"error": str(e)}), 500

@bp.route("/history/message_feedback", methods=["POST"])
async def update_message():
     # (Keep original implementation)
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        request_json = await request.get_json()
        if not request_json:
             return jsonify({"error": "request body cannot be empty json"}), 400
    except Exception as e:
        logging.error(f"Failed to parse request JSON in /history/message_feedback: {e}")
        return jsonify({"error": f"Invalid JSON in request body: {e}"}), 400

    message_id = request_json.get("message_id", None)
    message_feedback = request_json.get("message_feedback", None)
    try:
        if not message_id:
            return jsonify({"error": "message_id is required"}), 400
        if not message_feedback:
            return jsonify({"error": "message_feedback is required"}), 400
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/message_feedback")
             raise Exception("CosmosDB is not configured or not working")

        updated_message = await current_app.cosmos_conversation_client.update_message_feedback(
            user_id, message_id, message_feedback
        )
        if updated_message:
             logging.info(f"Updated feedback for message {message_id} to {message_feedback}")
             return jsonify({"message": "Feedback updated successfully", "message_id": message_id}), 200
        else:
             logging.warning(f"Failed to update feedback for message {message_id}. Not found or permission denied.")
             return jsonify({"error": f"Message {message_id} not found or access denied."}), 404

    except Exception as e:
        logging.exception("Exception in /history/message_feedback")
        return jsonify({"error": str(e)}), 500

@bp.route("/history/delete", methods=["DELETE"])
async def delete_conversation():
     # (Keep original implementation)
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        request_json = await request.get_json()
        if not request_json:
             return jsonify({"error": "request body cannot be empty json"}), 400
    except Exception as e:
        logging.error(f"Failed to parse request JSON in /history/delete: {e}")
        return jsonify({"error": f"Invalid JSON in request body: {e}"}), 400

    conversation_id = request_json.get("conversation_id", None)

    try:
        if not conversation_id:
            return jsonify({"error": "conversation_id is required"}), 400
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/delete")
             raise Exception("CosmosDB is not configured or not working")

        # delete messages first
        await current_app.cosmos_conversation_client.delete_messages(conversation_id, user_id)
        # delete conversation metadata
        await current_app.cosmos_conversation_client.delete_conversation(user_id, conversation_id)

        logging.info(f"Deleted conversation {conversation_id} for user {user_id}")
        return jsonify({"message": "Conversation deleted successfully", "conversation_id": conversation_id}), 200
    except Exception as e:
        logging.exception(f"Exception in /history/delete for conversation {conversation_id}")
        return jsonify({"error": str(e)}), 500

@bp.route("/history/list", methods=["GET"])
async def list_conversations():
     # (Keep original implementation)
    await cosmos_db_ready.wait()
    try:
        offset = int(request.args.get("offset", 0))
    except ValueError:
        return jsonify({"error": "offset parameter must be an integer"}), 400

    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/list")
             raise Exception("CosmosDB is not configured or not working")

        conversations = await current_app.cosmos_conversation_client.get_conversations(
            user_id, offset=offset, limit=25 # Limit to 25 conversations per request
        )
        return jsonify(conversations), 200 # Returns empty list [] if none found, not 404

    except Exception as e:
        logging.exception("Exception in /history/list")
        return jsonify({"error": str(e)}), 500


@bp.route("/history/read", methods=["POST"])
async def get_conversation():
     # (Keep original implementation)
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        request_json = await request.get_json()
        if not request_json:
             return jsonify({"error": "request body cannot be empty json"}), 400
    except Exception as e:
        logging.error(f"Failed to parse request JSON in /history/read: {e}")
        return jsonify({"error": f"Invalid JSON in request body: {e}"}), 400

    conversation_id = request_json.get("conversation_id", None)

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400

    try:
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/read")
             raise Exception("CosmosDB is not configured or not working")

        conversation = await current_app.cosmos_conversation_client.get_conversation(user_id, conversation_id)
        if not conversation:
             logging.warning(f"Conversation {conversation_id} not found for user {user_id}")
             return jsonify({"error": "Conversation not found or access denied"}), 404

        conversation_messages = await current_app.cosmos_conversation_client.get_messages(user_id, conversation_id)

        # Format messages for frontend
        messages = [
            {
                "id": msg.get("id"), # Use .get() for safety
                "role": msg.get("role"),
                "content": msg.get("content"),
                "createdAt": msg.get("createdAt"), # Use ISO format string
                "feedback": msg.get("feedback"),
            }
            for msg in conversation_messages if msg.get("role") and msg.get("content") is not None
        ]

        return jsonify({"conversation_id": conversation_id, "messages": messages}), 200

    except Exception as e:
        logging.exception(f"Exception in /history/read for conversation {conversation_id}")
        return jsonify({"error": str(e)}), 500


@bp.route("/history/rename", methods=["POST"])
async def rename_conversation():
     # (Keep original implementation)
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        request_json = await request.get_json()
        if not request_json:
             return jsonify({"error": "request body cannot be empty json"}), 400
    except Exception as e:
        logging.error(f"Failed to parse request JSON in /history/rename: {e}")
        return jsonify({"error": f"Invalid JSON in request body: {e}"}), 400

    conversation_id = request_json.get("conversation_id", None)
    title = request_json.get("title", None)

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400
    if not title:
        return jsonify({"error": "title is required"}), 400

    try:
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/rename")
             raise Exception("CosmosDB is not configured or not working")

        conversation = await current_app.cosmos_conversation_client.get_conversation(user_id, conversation_id)
        if not conversation:
             logging.warning(f"Conversation {conversation_id} not found for user {user_id} during rename.")
             return jsonify({"error": "Conversation not found or access denied"}), 404

        conversation["title"] = title
        updated_conversation = await current_app.cosmos_conversation_client.upsert_conversation(conversation)
        logging.info(f"Renamed conversation {conversation_id} to '{title}' for user {user_id}")
        return jsonify(updated_conversation), 200

    except Exception as e:
        logging.exception(f"Exception in /history/rename for conversation {conversation_id}")
        return jsonify({"error": str(e)}), 500


@bp.route("/history/delete_all", methods=["DELETE"])
async def delete_all_conversations():
     # (Keep original implementation)
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/delete_all")
             raise Exception("CosmosDB is not configured or not working")

        # Get all conversation IDs first
        conversations = await current_app.cosmos_conversation_client.get_conversations(user_id, offset=0, limit=None) # Get all

        deleted_count = 0
        if conversations:
            for conv in conversations:
                conv_id = conv.get("id")
                if conv_id:
                    # Delete messages first
                    await current_app.cosmos_conversation_client.delete_messages(conv_id, user_id)
                    # Then delete conversation
                    await current_app.cosmos_conversation_client.delete_conversation(user_id, conv_id)
                    deleted_count += 1
            logging.info(f"Deleted {deleted_count} conversations for user {user_id}")
            return jsonify({"message": f"Successfully deleted {deleted_count} conversations."}), 200
        else:
            logging.info(f"No conversations found to delete for user {user_id}")
            return jsonify({"message": "No conversations found to delete."}), 200

    except Exception as e:
        logging.exception(f"Exception in /history/delete_all for user {user_id}")
        return jsonify({"error": str(e)}), 500


@bp.route("/history/clear", methods=["POST"])
async def clear_messages():
     # (Keep original implementation)
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(request_headers=request.headers)
    if not authenticated_user or "user_principal_id" not in authenticated_user:
        return jsonify({"error": "Authentication failed or user details not found."}), 401
    user_id = authenticated_user["user_principal_id"]

    try:
        request_json = await request.get_json()
        if not request_json:
             return jsonify({"error": "request body cannot be empty json"}), 400
    except Exception as e:
        logging.error(f"Failed to parse request JSON in /history/clear: {e}")
        return jsonify({"error": f"Invalid JSON in request body: {e}"}), 400

    conversation_id = request_json.get("conversation_id", None)

    try:
        if not conversation_id:
            return jsonify({"error": "conversation_id is required"}), 400
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/clear")
             raise Exception("CosmosDB is not configured or not working")

        await current_app.cosmos_conversation_client.delete_messages(conversation_id, user_id)
        logging.info(f"Cleared messages for conversation {conversation_id} for user {user_id}")
        return jsonify({"message": "Successfully cleared messages", "conversation_id": conversation_id}), 200
    except Exception as e:
        logging.exception(f"Exception in /history/clear for conversation {conversation_id}")
        return jsonify({"error": str(e)}), 500


@bp.route("/history/ensure", methods=["GET"])
async def ensure_cosmos():
     # (Keep original implementation, add more logging)
    # Check if history is enabled in config first
    if not app_settings.chat_history or not app_settings.chat_history.enabled:
        logging.info("/history/ensure called but chat history is disabled in settings.")
        return jsonify({"error": "Chat history is not configured or disabled."}), 404

    await cosmos_db_ready.wait() # Wait if initialization is still in progress

    try:
        if not current_app.cosmos_conversation_client:
             logging.error("CosmosDB client not available in /history/ensure")
             raise Exception("CosmosDB is not configured or not working")

        success, err = await current_app.cosmos_conversation_client.ensure()
        if not success:
            logging.error(f"CosmosDB ensure call failed: {err}")
            if "Invalid credentials" in str(err): return jsonify({"error": f"CosmosDB connection failed: {err}"}), 401
            if "database" in str(err).lower(): return jsonify({"error": f"CosmosDB database ensure failed: {err}"}), 422
            if "container" in str(err).lower(): return jsonify({"error": f"CosmosDB container ensure failed: {err}"}), 422
            return jsonify({"error": f"CosmosDB ensure failed: {err}"}), 500
        else:
            logging.info("CosmosDB ensure check successful.")
            return jsonify({"message": "CosmosDB is configured and working"}), 200

    except Exception as e:
        logging.exception("Exception during /history/ensure check")
        return jsonify({"error": f"CosmosDB health check failed: {e}"}), 500


async def generate_title(conversation_messages) -> str:
     # (Keep original implementation, add null checks)
    title_prompt = "Summarize the conversation so far into a 4-word or less title. Do not use any quotation marks or punctuation. Do not include any other commentary or description."

    messages = [
        {"role": msg.get("role"), "content": msg.get("content")}
        for msg in conversation_messages if msg.get("role") and msg.get("content")
    ]
    # Only generate title if there are actual messages
    if not messages:
         return "New Chat"

    messages.append({"role": "user", "content": title_prompt})

    try:
        azure_openai_client = await init_openai_client()
        if not azure_openai_client:
             raise Exception("Azure OpenAI client not initialized for title generation.")

        response = await azure_openai_client.chat.completions.create(
            model=app_settings.azure_openai.model, # Use configured chat model
            messages=messages,
            temperature=0.7, # Lower temp for more deterministic title
            max_tokens=20 # Limit tokens for title
        )

        title = response.choices[0].message.content.strip().replace('"', '').replace("'", '')
        # Basic cleanup
        if not title:
             raise Exception("Generated title was empty.")
        logging.info(f"Generated title: {title}")
        return title[:50] # Limit length just in case
    except Exception as e:
        logging.exception("Exception while generating title")
        # Fallback: return based on the last user message content
        user_messages = [msg.get("content", "") for msg in conversation_messages if msg.get("role") == "user"]
        last_user_message = user_messages[-1][:50] if user_messages else "Chat" # Limit length
        logging.warning(f"Using fallback title: {last_user_message}")
        return last_user_message


app = create_app()

# Example of how to run locally if needed (usually Gunicorn handles this in App Service)
# if __name__ == "__main__":
#     # Setup basic logging for local run
#     logging.basicConfig(level=logging.DEBUG if DEBUG.lower() == "true" else logging.INFO,
#                         format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
#     port = int(os.environ.get("PORT", 8000)) # Default to 8000 for local dev
#     logging.info(f"Starting Quart app locally on port {port}")
#     app.run(debug=(DEBUG.lower() == "true"), host="0.0.0.0", port=port)
