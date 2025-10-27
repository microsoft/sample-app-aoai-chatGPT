import json
import os
import logging
import requests
import hashlib
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from azure.identity import DefaultAzureCredential
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
    generateFilteredMessages,
    format_non_streaming_response,
    convert_to_pf_format,
    format_pf_non_streaming_response,
)
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

bp = Flask(__name__, static_folder="static")
bp.config["TEMPLATES_AUTO_RELOAD"] = True

# Debug settings
DEBUG = os.environ.get("DEBUG", "false")
if DEBUG.lower() == "true":
    logging.basicConfig(level=logging.DEBUG)

USER_AGENT = "GitHubSampleWebApp/AsyncAzureOpenAI/1.0.0"

# Enable Flask instrumentation for OpenTelemetry
FlaskInstrumentor().instrument_app(bp)
# Enable requests instrumentation for OpenTelemetry
RequestsInstrumentor().instrument()

# Initialize Azure Cosmos DB client
cosmos_conversation_client = None
if app_settings.chat_history:
    try:
        cosmos_endpoint = (
            f"https://{app_settings.chat_history.account}.documents.azure.com:443/"
        )
        
        if not app_settings.chat_history.account_key:
            credential = DefaultAzureCredential()
        else:
            credential = app_settings.chat_history.account_key
            
        cosmos_conversation_client = CosmosConversationClient(
            cosmosdb_endpoint=cosmos_endpoint,
            credential=credential,
            database_name=app_settings.chat_history.database,
            container_name=app_settings.chat_history.conversations_container,
            enable_message_feedback=app_settings.chat_history.enable_feedback,
        )
    except Exception as e:
        logging.exception("Exception in CosmosDB initialization", e)
        cosmos_conversation_client = None


def create_app():
    return bp


@bp.route("/", defaults={"path": "index.html"})
@bp.route("/<path:path>")
def static_file(path):
    return send_from_directory(bp.static_folder, path)


def conversation_with_data(request_body):
    body, headers = prepare_body_headers_with_data(request_body)
    endpoint = (
        f"{app_settings.azure_openai.endpoint}openai/deployments/{app_settings.azure_openai.model}"
        f"/extensions/chat/completions?api-version={app_settings.azure_openai.preview_api_version}"
    )
    
    if not app_settings.azure_openai.key:
        headers["Authorization"] = f"Bearer {app_settings.azure_openai.token_provider()}"

    r = requests.post(endpoint, headers=headers, json=body)
    status_code = r.status_code
    r.raise_for_status()

    if app_settings.azure_openai.stream:
        response = format_stream_response(r)
        return response, status_code
    else:
        response = format_non_streaming_response(r.json(), request_body.get("messages", []))
        return jsonify(response), status_code


def prepare_body_headers_with_data(request_body):
    request_messages = request_body.get("messages", [])
    
    # Set query type
    query_type = "simple"
    if (
        app_settings.datasource
        and app_settings.datasource.query_type
    ):
        query_type = app_settings.datasource.query_type
        
    # Set filter
    filter = None
    userToken = None
    if app_settings.datasource and app_settings.datasource.filter:
        filter = app_settings.datasource.filter
        userToken = request.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN", "")

    # MSPYT Customization: Authenticated user email
    user_json = None
    if (
        app_settings.azure_openai.authentication
        and app_settings.azure_openai.authentication.type == "rbac"
    ):
        authenticated_user_details = get_authenticated_user_details(request.headers)
        conversation_id = request_body.get("conversation_id", None)
        
        if (
            app_settings.azure_openai.authentication.enable_ms_defender_user_json
            and authenticated_user_details
        ):
            user_json = get_msdefender_user_json(
                authenticated_user_details, request_messages, conversation_id
            )

    body = {
        "messages": request_messages,
        "temperature": app_settings.azure_openai.temperature,
        "max_tokens": app_settings.azure_openai.max_tokens,
        "top_p": app_settings.azure_openai.top_p,
        "stop": app_settings.azure_openai.stop_sequence,
        "stream": app_settings.azure_openai.stream,
        "dataSources": []
    }

    if app_settings.datasource:
        # Add data source configuration
        data_source = {
            "type": "AzureCognitiveSearch",
            "parameters": {
                "endpoint": app_settings.datasource.endpoint,
                "key": app_settings.datasource.key,
                "indexName": app_settings.datasource.index,
            }
        }
        
        # Add optional parameters
        if query_type:
            data_source["parameters"]["queryType"] = query_type
        if app_settings.datasource.semantic_configuration:
            data_source["parameters"]["semanticConfiguration"] = (
                app_settings.datasource.semantic_configuration
            )
        if app_settings.datasource.role_information:
            data_source["parameters"]["roleInformation"] = (
                app_settings.datasource.role_information
            )
        if filter:
            data_source["parameters"]["filter"] = filter
        if app_settings.datasource.strictness:
            data_source["parameters"]["strictness"] = app_settings.datasource.strictness
        if app_settings.datasource.top_n_documents:
            data_source["parameters"]["topNDocuments"] = (
                app_settings.datasource.top_n_documents
            )
        if app_settings.datasource.in_scope is not None:
            data_source["parameters"]["inScope"] = app_settings.datasource.in_scope

        body["dataSources"].append(data_source)

    headers = {
        "Content-Type": "application/json",
        "api-key": app_settings.azure_openai.key,
        "x-ms-useragent": USER_AGENT,
    }

    if user_json:
        headers["X-MS-DEFENDER-USER-JSON"] = user_json

    return body, headers


@bp.route("/conversation", methods=["POST"])
def conversation():
    if not request.is_json:
        return jsonify({"error": "request must be json"}), 415

    request_json = request.get_json()

    try:
        # Get user info from headers if auth enabled
        user_id = None
        if app_settings.azure_openai.authentication:
            authenticated_user = get_authenticated_user_details(request.headers)
            user_id = authenticated_user.get("user_principal_id") if authenticated_user else None

        # Call Azure OpenAI
        max_retries = 3
        retry_count = 0
        result_dict = None
        
        while retry_count < max_retries:
            try:
                if app_settings.datasource:
                    result, status_code = conversation_with_data(request_json)
                    result_dict = result if isinstance(result, dict) else result.get_json()
                else:
                    # Direct Azure OpenAI call without data source
                    result_dict = call_azure_openai_direct(request_json)
                break
            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    logging.error(f"Error in /conversation after {max_retries} retries: {str(e)}")
                    return jsonify({"error": str(e)}), 500

        if result_dict is None:
            return jsonify({"error": "Exceeded maximum retries"}), 500

        # Format response for frontend
        response_obj = {
            "id": result_dict.get("id"),
            "model": result_dict.get("model"),
            "created": result_dict.get("created"),
            "object": result_dict.get("object"),
            "choices": [{
                "message": result_dict["choices"][0]["message"]
            }],
            "history_metadata": result_dict.get("history_metadata", {}),
        }

        # Save to Cosmos DB if enabled
        if cosmos_conversation_client and user_id:
            conversation_id = request_json.get("conversation_id")
            try:
                if conversation_id:
                    cosmos_conversation_client.upsert_conversation(
                        conversation_id=conversation_id,
                        messages=request_json.get("messages", []),
                    )
                else:
                    # Create new conversation
                    conversation_dict = cosmos_conversation_client.create_conversation(
                        user_id=user_id,
                        title=request_json.get("messages", [{}])[0].get("content", "")[:50],
                    )
                    conversation_id = conversation_dict["id"]
                    response_obj["conversation_id"] = conversation_id
            except Exception as e:
                logging.error(f"Error saving to Cosmos DB: {str(e)}")

        return jsonify(response_obj), 200

    except Exception as e:
        logging.exception("Exception in /conversation")
        return jsonify({"error": str(e)}), 500


def call_azure_openai_direct(request_body):
    """Call Azure OpenAI directly without data source"""
    endpoint = (
        f"{app_settings.azure_openai.endpoint}openai/deployments/"
        f"{app_settings.azure_openai.model}/chat/completions"
        f"?api-version={app_settings.azure_openai.preview_api_version}"
    )
    
    headers = {
        "Content-Type": "application/json",
        "api-key": app_settings.azure_openai.key,
    }
    
    body = {
        "messages": request_body.get("messages", []),
        "temperature": app_settings.azure_openai.temperature,
        "max_tokens": app_settings.azure_openai.max_tokens,
        "top_p": app_settings.azure_openai.top_p,
        "stream": False,
    }
    
    r = requests.post(endpoint, headers=headers, json=body)
    r.raise_for_status()
    return r.json()


@bp.route("/history/generate", methods=["POST"])
def add_conversation():
    if not app_settings.chat_history:
        return jsonify({"error": "Chat history not configured"}), 501
        
    authenticated_user = get_authenticated_user_details(request.headers)
    user_id = authenticated_user["user_principal_id"]

    ## check request for conversation_id
    request_json = request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    try:
        # make sure cosmos is configured
        if not cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")

        # check for the conversation_id, if the conversation is not set, we will create a new one
        history_metadata = {}
        if not conversation_id:
            title = generate_title(request_json["messages"])
            conversation_dict = cosmos_conversation_client.create_conversation(
                user_id=user_id, title=title
            )
            conversation_id = conversation_dict["id"]
            history_metadata["title"] = title
            history_metadata["date"] = conversation_dict["createdAt"]

        ## Format the incoming message object in the "chat/completions" messages format
        ## then write it to the conversation history in cosmos
        messages = request_json["messages"]
        if len(messages) > 0 and messages[-1]["role"] == "user":
            createdMessageValue = cosmos_conversation_client.create_message(
                uuid=str(generate_uuid()),
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

        # Submit request to Azure OpenAI model
        request_body = {
            "messages": generateFilteredMessages(messages, app_settings.azure_openai.system_message),
            "conversation_id": conversation_id,
        }

        if app_settings.datasource:
            result, status_code = conversation_with_data(request_body)
            result_dict = result if isinstance(result, dict) else result.get_json()
        else:
            result_dict = call_azure_openai_direct(request_body)
            status_code = 200

        # Format response
        response_obj = {
            "id": result_dict.get("id"),
            "model": result_dict.get("model"),
            "created": result_dict.get("created"),
            "object": result_dict.get("object"),
            "choices": [{
                "messages": [result_dict["choices"][0]["message"]]
            }],
            "history_metadata": history_metadata,
        }

        # Save assistant message to Cosmos DB
        if len(result_dict["choices"]) > 0:
            cosmos_conversation_client.create_message(
                uuid=result_dict.get("id", str(generate_uuid())),
                conversation_id=conversation_id,
                user_id=user_id,
                input_message=result_dict["choices"][0]["message"],
            )

        return jsonify(response_obj), status_code

    except Exception as e:
        logging.exception("Exception in /history/generate")
        return jsonify({"error": str(e)}), 500


def generate_title(messages):
    """Generate a title for the conversation based on the first message"""
    if messages and len(messages) > 0:
        first_message = messages[0].get("content", "")
        return first_message[:50] + ("..." if len(first_message) > 50 else "")
    return "New Conversation"


def generate_uuid():
    """Generate a UUID for message IDs"""
    import uuid
    return uuid.uuid4()


@bp.route("/history/list", methods=["GET"])
def list_conversations():
    if not app_settings.chat_history:
        return jsonify({"error": "Chat history not configured"}), 501
        
    authenticated_user = get_authenticated_user_details(request.headers)
    user_id = authenticated_user["user_principal_id"]

    ## get the conversations from cosmos
    conversations = cosmos_conversation_client.get_conversations(
        user_id, limit=request.args.get("limit", 25), sort_order="DESC"
    )
    if not isinstance(conversations, list):
        return jsonify({"error": f"No conversations for {user_id} were found"}), 404

    ## return the conversation ids

    return jsonify(conversations), 200


@bp.route("/history/read", methods=["POST"])
def get_conversation():
    if not app_settings.chat_history:
        return jsonify({"error": "Chat history not configured"}), 501
        
    authenticated_user = get_authenticated_user_details(request.headers)
    user_id = authenticated_user["user_principal_id"]

    ## check request for conversation_id
    request_json = request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400

    ## get the conversation object and the related messages from cosmos
    conversation = cosmos_conversation_client.get_conversation(user_id, conversation_id)
    ## return the conversation id and the messages in the bot frontend format
    if not conversation:
        return (
            jsonify(
                {
                    "error": f"Conversation {conversation_id} was not found. It either does not exist or the logged in user does not have access to it."
                }
            ),
            404,
        )

    # get the messages for the conversation from cosmos
    conversation_messages = cosmos_conversation_client.get_messages(
        user_id, conversation_id
    )

    ## format the messages in the bot frontend format
    messages = [
        {
            "id": msg["id"],
            "role": msg["role"],
            "content": msg["content"],
            "createdAt": msg["createdAt"],
        }
        for msg in conversation_messages
    ]

    return jsonify({"conversation_id": conversation_id, "messages": messages}), 200


@bp.route("/history/delete", methods=["DELETE"])
def delete_conversation():
    if not app_settings.chat_history:
        return jsonify({"error": "Chat history not configured"}), 501
        
    ## get the user id from the request headers
    authenticated_user = get_authenticated_user_details(request.headers)
    user_id = authenticated_user["user_principal_id"]

    ## check request for conversation_id
    request_json = request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400

    ## delete the conversation messages from cosmos first
    deleted_messages = cosmos_conversation_client.delete_messages(
        conversation_id, user_id
    )

    ## Now delete the conversation
    deleted_conversation = cosmos_conversation_client.delete_conversation(
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


@bp.route("/history/delete_all", methods=["DELETE"])
def delete_all_conversations():
    if not app_settings.chat_history:
        return jsonify({"error": "Chat history not configured"}), 501
        
    ## get the user id from the request headers
    authenticated_user = get_authenticated_user_details(request.headers)
    user_id = authenticated_user["user_principal_id"]

    # get conversations for user
    conversations = cosmos_conversation_client.get_conversations(
        user_id, limit=None, sort_order="DESC"
    )
    if not conversations:
        return jsonify({"error": f"No conversations for {user_id} were found"}), 404

    # delete each conversation
    for conversation in conversations:
        ## delete the conversation messages from cosmos first
        deleted_messages = cosmos_conversation_client.delete_messages(
            conversation["id"], user_id
        )

        ## Now delete the conversation
        deleted_conversation = cosmos_conversation_client.delete_conversation(
            user_id, conversation["id"]
        )

    return (
        jsonify(
            {
                "message": f"Successfully deleted all conversations and messages for user {user_id}"
            }
        ),
        200,
    )


@bp.route("/history/clear", methods=["POST"])
def clear_messages():
    if not app_settings.chat_history:
        return jsonify({"error": "Chat history not configured"}), 501
        
    ## get the user id from the request headers
    authenticated_user = get_authenticated_user_details(request.headers)
    user_id = authenticated_user["user_principal_id"]

    ## check request for conversation_id
    request_json = request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400

    ## delete the conversation messages from cosmos
    deleted_messages = cosmos_conversation_client.delete_messages(
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


@bp.route("/history/rename", methods=["POST"])
def rename_conversation():
    if not app_settings.chat_history:
        return jsonify({"error": "Chat history not configured"}), 501
        
    authenticated_user = get_authenticated_user_details(request.headers)
    user_id = authenticated_user["user_principal_id"]

    ## check request for conversation_id
    request_json = request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400

    ## get the new title from the request
    new_title = request_json.get("title", None)
    if not new_title:
        return jsonify({"error": "title is required"}), 400

    ## update the conversation title in cosmos
    conversation = cosmos_conversation_client.get_conversation(user_id, conversation_id)
    if not conversation:
        return (
            jsonify(
                {
                    "error": f"Conversation {conversation_id} was not found. It either does not exist or the logged in user does not have access to it."
                }
            ),
            404,
        )

    conversation["title"] = new_title
    updated_conversation = cosmos_conversation_client.upsert_conversation(conversation)

    return jsonify(updated_conversation), 200


@bp.route("/history/update", methods=["POST"])
def update_message():
    if not app_settings.chat_history:
        return jsonify({"error": "Chat history not configured"}), 501
        
    authenticated_user = get_authenticated_user_details(request.headers)
    user_id = authenticated_user["user_principal_id"]

    ## check request for message_id
    request_json = request.get_json()
    message_id = request_json.get("message_id", None)
    if not message_id:
        return jsonify({"error": "message_id is required"}), 400

    ## get the message from cosmos
    message = cosmos_conversation_client.get_message(message_id)
    if not message:
        return (
            jsonify(
                {
                    "error": f"Message {message_id} was not found. It either does not exist or the logged in user does not have access to it."
                }
            ),
            404,
        )

    ## update the message
    if request_json.get("liked") is not None:
        message["liked"] = request_json.get("liked")

    if request_json.get("feedback") is not None:
        message["feedback"] = request_json.get("feedback")

    updated_message = cosmos_conversation_client.upsert_message(message)

    return jsonify(updated_message), 200


if __name__ == "__main__":
    bp.run()
