import copy
import json
import os
import logging
import uuid
import time
import httpx
import asyncio
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

bp = Blueprint("routes", __name__, static_folder="static",
               template_folder="static")

cosmos_db_ready = asyncio.Event()


def create_app():
    app = Quart(__name__)
    app.register_blueprint(bp)
    app.config["TEMPLATES_AUTO_RELOAD"] = True

    @app.before_serving
    async def init():
        try:
            app.cosmos_conversation_client = await init_cosmosdb_client()
            cosmos_db_ready.set()
        except Exception as e:
            logging.exception("Failed to initialize CosmosDB client")
            app.cosmos_conversation_client = None
            raise e

    return app


@bp.route("/")
async def index():
    return await render_template(
        "index.html",
        title=app_settings.ui.title,
        favicon=app_settings.ui.favicon
    )


@bp.route("/favicon.ico")
async def favicon():
    return await bp.send_static_file("favicon.ico")


@bp.route("/assets/<path:path>")
async def assets(path):
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
MS_DEFENDER_ENABLED = os.environ.get(
    "MS_DEFENDER_ENABLED", "true").lower() == "true"


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
        aoai_api_key = app_settings.azure_openai.key
        ad_token_provider = None
        if not aoai_api_key:
            logging.debug(
                "No AZURE_OPENAI_KEY found, using Azure Entra ID auth")
            async with DefaultAzureCredential() as credential:
                ad_token_provider = get_bearer_token_provider(
                    credential,
                    "https://cognitiveservices.azure.com/.default"
                )

        # Deployment
        deployment = app_settings.azure_openai.model
        if not deployment:
            raise ValueError("AZURE_OPENAI_MODEL is required")

        # Default Headers
        default_headers = {"x-ms-useragent": USER_AGENT}

        azure_openai_client = AsyncAzureOpenAI(
            api_version=app_settings.azure_openai.preview_api_version,
            api_key=aoai_api_key,
            azure_ad_token_provider=ad_token_provider,
            default_headers=default_headers,
            azure_endpoint=endpoint,
        )

        return azure_openai_client
    except Exception as e:
        logging.exception("Exception in Azure OpenAI initialization", e)
        azure_openai_client = None
        raise e


async def init_assistant_client():
    try:
        azure_openai_client = await init_openai_client()
        cleanup_bullhorn_results()
        """
Willkommen! Sie können Bullhorn durchsuchen, Ergebnisse anzeigen und Kandidaten filtern. Hier sind die verfügbaren Befehle:
---
**1. Bullhorn-Suche**
- Geben Sie "Durchsuche Bullhorn" gefolgt von Ihrer Suchanfrage ein, um Kandidaten aus Bullhorn abzurufen.
  Beispiel:
  `Durchsuche Bullhorn nach Java-Entwicklern in Berlin`
  - Die Ergebnisse werden als JSON gespeichert, das folgende Felder enthält:
    - **total:** Gesamtanzahl der gefundenen Kandidaten
    - **count:** Anzahl der angezeigten Kandidaten
    - **mssg:** Statusnachricht
    - **candidates:** Liste der Kandidaten
---
**2. Bullhorn Ergebnisse anzeigen**
- Zeigen Sie die Übersicht der Bullhorn-Ergebnisse an, indem Sie `zeige Bullhorn Ergebnisse an` eingeben. Die Formatierung lautet:
  _"Von {total} Ergebnissen in Bullhorn habe ich {count} erhalten."_
---
**3. Kandidaten filtern**
- Wenn mehr als 6 Kandidaten gefunden wurden, können Sie die besten 6 Kandidaten herausfiltern, indem Sie den Befehl `Filter die Kandidaten` gefolgt von den gewünschten Kriterien verwenden.
- Falls diese Aktion ausgeführt wird, nutzen Sie das Tool `filter_candidates`, um die Kandidatenliste basierend auf den gespeicherten Suchergebnissen zu reduzieren.
---
**4. Kandidaten anzeigen**
- Rufen Sie die aktuellen Kandidaten im Kontext ab, indem Sie `zeige Kandidaten` eingeben.
  Die Formatierung der Kandidatenliste lautet:
  - **{firstName} {lastName} ({id})**
    _([Link zu Bullhorn als Pop-up](https://cls70.bullhornstaffing.com/BullhornSTAFFING/OpenWindow.cfm?Entity=Candidate&id={id}|Bullhorn))_
  - **Zusammenfassung:**
    Eine kurze, aber prägnante Zusammenfassung der relevanten Informationen zum Kandidaten (z. B. Berufserfahrung, Fähigkeiten oder Schlüsselqualifikationen).
---
**Beispiel-Workflow:**
1. Starten Sie eine Bullhorn-Suche:
   `Durchsuche Bullhorn nach Projektmanagern in Hamburg`
   Der Assistent speichert die Ergebnisse.
2. Anzeigen der Bullhorn-Ergebnisse:
   `zeige Bullhorn Ergebnisse an`
   Der Assistent gibt eine Übersicht der Gesamtergebnisse.
3. Wenn mehr als 6 Kandidaten gefunden wurden, filtern Sie die besten 6:
   `Filter die Kandidaten`
4. Zeigen Sie die gefilterten Kandidaten an:
   `zeige Kandidaten`
   Die Kandidatenliste enthält direkt anklickbare Links zu den Kandidatenprofilen in Bullhorn und eine zusammenfassende Darstellung ihrer Qualifikationen.
Falls Sie Fragen haben oder Unterstützung benötigen, lassen Sie es mich wissen!
        """

        system_message = """Willkommen! Sie können Bullhorn durchsuchen, Ergebnisse anzeigen und die 6 besten Kandidaten filtern. Hier sind die verfügbaren Funktionen:
---
**Bullhorn-Suche**
- Nutzen Sie die Funktion `bullhorn_search`, um Kandidaten in Bullhorn zu suchen.
Nach der Bullhorn-Suche stehen die Ergebnisse sofort zur Verfügung und können **ohne zusätzliche Anzeige gefiltert werden**.
  Beispiel:
  `Durchsuche Bullhorn nach Java-Entwicklern in Berlin.`
  - Die Ergebnisse werden als JSON gespeichert und enthalten:
    - **total:** Gesamtanzahl der gefundenen Kandidaten
    - **count:** Anzahl der angezeigten Kandidaten
    - **mssg:** Statusnachricht
    - **candidates:** Liste der Kandidaten
---
**Kandidatenübersicht anzeigen**
- Nutzen Sie die Funktion `show_bullhorn_results`, um eine Zusammenfassung der aktuellen Bullhorn-Ergebnisse anzuzeigen.
  - Dazu muss der Benutzer `Zeige Bullhorn Ergebnisse an` eingeben.
  - Ausgabeformat:
    _"Von {total} Ergebnissen in Bullhorn habe ich {count} erhalten."_
---
**Kandidaten filtern**
- Nutzen Sie die Funktion `filter_candidates`, um die 6 besten Kandidaten basierend auf einen frei formulierten Filtertext zu filtern.
- Der Benutzer gibt genau folgenden Nachricht ein: "Filter die 6 besten Kandidaten:{filterQ}".
- **Eingabeformat:** {"filterQ": "<Ihr freier Text mit den Filterbedingungen>"}
- **Hinweis:** Die zu filternde Kandidatenliste wird intern aus dem globalen Speicher entnommen – sie muss nicht als Parameter übergeben werden.
- **Ausgabeformat:**  
  - Es sind {count_of_filtered_candidates} Kandidaten gefunden worden.
  - Eine Liste der gefilterten Kandidaten, z. B. in der Form:  
    **{firstName} {lastName} ({id})**  
    _([Link zu Bullhorn](https://cls70.bullhornstaffing.com/BullhornSTAFFING/OpenWindow.cfm?Entity=Candidate&id={id}))_  
  - Eine Zusammenfassung der relevanten Qualifikationen.
---
Es darf pro Eingabe nur eine Funktion aufgerufen werden!
Falls Sie Fragen haben oder Unterstützung benötigen, lassen Sie es mich wissen!
        """

        # app_settings.azure_openai.system_message

        assistant = await azure_openai_client.beta.assistants.create(
            model="gpt-4o",
            instructions=system_message,
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "bullhorn_search",
                        "description": "Durchsucht Bullhorn nach Kandidaten anhand einer Suchanfrage.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "searchQ": {"type": "string", "description": "Die Suchanfrage für Bullhorn"}
                            }
                        },
                        "strict": False,
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "show_bullhorn_results",
                        "description": "Zeigt eine Zusammenfassung der aktuellen Bullhorn-Ergebnisse.",
                        "parameters": {
                            "type": "object",
                            "properties": {}
                        },
                        "strict": False
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "filter_candidates",
                        "description": "Filter die 6 besten Kandidaten basierend auf einer Benutzereingabe.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                # "candidates": {
                                #    "type": "array",
                                #    "items": {
                                #        "type": "object",
                                #        "properties": {},
                                #        "additionalProperties": True  # Erlaubt ALLE Daten
                                #    },
                                #    "description": "Die Liste der zu filternden Kandidaten"
                                # },
                                "filterQ": {
                                    "type": "string",
                                    "description": "Filterbedingungen, z. B. 'nicht älter als 35' oder 'mit Erfahrung in Java'."
                                }
                            }
                        },
                        "strict": False
                    }
                }
            ],
            tool_resources={},
            temperature=1,
            top_p=1,
        )

        logging.debug(f"Assistant created with ID: {assistant.id}")
        logging.debug(f"Registered tools: {assistant.tools}")

        return assistant
    except Exception as e:
        logging.exception("Exception in Assistant Initialization", e)
        raise e

BULLHORN_RESULTS = {}


def store_bullhorn_results(thread_id, candidates, ttl=600):
    expiry = time.time() + ttl
    BULLHORN_RESULTS['id'] = thread_id
    logging.debug(f"XXXXXXstore_bullhorn_results(thread_id={thread_id})")
    BULLHORN_RESULTS[thread_id] = {"data": candidates, "expiry": expiry}


def get_bullhorn_results():
    logging.debug(
        f"XXXXXXget_bullhorn_results(thread_id={BULLHORN_RESULTS['id']})")
    if BULLHORN_RESULTS['id'] in BULLHORN_RESULTS:
        return BULLHORN_RESULTS[BULLHORN_RESULTS['id']]["data"]
    return None


def cleanup_bullhorn_results():
    """Regelmäßige Bereinigung alter Einträge."""
    """""
    now = time.time()
    expired_keys = [k for k, v in BULLHORN_RESULTS.items()
                    if v["expiry"] < now]
    for key in expired_keys:
        del BULLHORN_RESULTS[key]  # ❌ Löschen
    """""


async def init_cosmosdb_client():
    cosmos_conversation_client = None
    if app_settings.chat_history:
        try:
            cosmos_endpoint = (
                f"https://{app_settings.chat_history.account}.documents.azure.com:443/"
            )

            if not app_settings.chat_history.account_key:
                async with DefaultAzureCredential() as cred:
                    credential = cred

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
            raise e
    else:
        logging.debug("CosmosDB not configured")

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
            if message["role"] == "assistant" and "context" in message:
                context_obj = json.loads(message["context"])
                messages.append(
                    {
                        "role": message["role"],
                        "content": message["content"],
                        "context": context_obj
                    }
                )
            else:
                messages.append(
                    {
                        "role": message["role"],
                        "content": message["content"]
                    }
                )

    user_json = None
    if (MS_DEFENDER_ENABLED):
        authenticated_user_details = get_authenticated_user_details(
            request_headers)
        conversation_id = request_body.get("conversation_id", None)
        application_name = app_settings.ui.title
        user_json = get_msdefender_user_json(
            authenticated_user_details, request_headers, conversation_id, application_name)

    model_args = {
        "messages": messages,
        "temperature": app_settings.azure_openai.temperature,
        "max_tokens": app_settings.azure_openai.max_tokens,
        "top_p": app_settings.azure_openai.top_p,
        "stop": app_settings.azure_openai.stop_sequence,
        "stream": app_settings.azure_openai.stream,
        "model": app_settings.azure_openai.model,
        "user": user_json
    }

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
        for secret_param in secret_params:
            if model_args_clean["extra_body"]["data_sources"][0]["parameters"].get(
                secret_param
            ):
                model_args_clean["extra_body"]["data_sources"][0]["parameters"][
                    secret_param
                ] = "*****"
        authentication = model_args_clean["extra_body"]["data_sources"][0][
            "parameters"
        ].get("authentication", {})
        for field in authentication:
            if field in secret_params:
                model_args_clean["extra_body"]["data_sources"][0]["parameters"][
                    "authentication"
                ][field] = "*****"
        embeddingDependency = model_args_clean["extra_body"]["data_sources"][0][
            "parameters"
        ].get("embedding_dependency", {})
        if "authentication" in embeddingDependency:
            for field in embeddingDependency["authentication"]:
                if field in secret_params:
                    model_args_clean["extra_body"]["data_sources"][0]["parameters"][
                        "embedding_dependency"
                    ]["authentication"][field] = "*****"

    logging.debug(f"REQUEST BODY: {json.dumps(model_args_clean, indent=4)}")

    return model_args


async def promptflow_request(request):
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {app_settings.promptflow.api_key}",
        }
        # Adding timeout for scenarios where response takes longer to come back
        logging.debug(
            f"Setting timeout to {app_settings.promptflow.response_timeout}")
        async with httpx.AsyncClient(
            timeout=float(app_settings.promptflow.response_timeout)
        ) as client:
            pf_formatted_obj = convert_to_pf_format(
                request,
                app_settings.promptflow.request_field_name,
                app_settings.promptflow.response_field_name
            )
            # NOTE: This only support question and chat_history parameters
            # If you need to add more parameters, you need to modify the request body
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
        logging.error(
            f"An error occurred while making promptflow_request: {e}")


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
        return format_non_streaming_response(response, history_metadata, apim_request_id)


async def stream_chat_request(request_body, request_headers):
    response, apim_request_id = await send_chat_request(request_body, request_headers)
    history_metadata = request_body.get("history_metadata", {})

    async def generate():
        async for completionChunk in response:
            yield format_stream_response(completionChunk, history_metadata, apim_request_id)

    return generate()


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


## Conversation History API ##
@bp.route("/history/generate", methods=["POST"])
async def add_conversation():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # check request for conversation_id
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    try:
        # make sure cosmos is configured
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")

        # check for the conversation_id, if the conversation is not set, we will create a new one
        history_metadata = {}
        if not conversation_id:
            title = await generate_title(request_json["messages"])
            conversation_dict = await current_app.cosmos_conversation_client.create_conversation(
                user_id=user_id, title=title
            )
            conversation_id = conversation_dict["id"]
            history_metadata["title"] = title
            history_metadata["date"] = conversation_dict["createdAt"]

        # Format the incoming message object in the "chat/completions" messages format
        # then write it to the conversation history in cosmos
        messages = request_json["messages"]
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

        # Submit request to Chat Completions for response
        request_body = await request.get_json()
        history_metadata["conversation_id"] = conversation_id
        request_body["history_metadata"] = history_metadata
        return await conversation_internal(request_body, request.headers)

    except Exception as e:
        logging.exception("Exception in /history/generate")
        return jsonify({"error": str(e)}), 500


@bp.route("/history/update", methods=["POST"])
async def update_conversation():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # check request for conversation_id
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    try:
        # make sure cosmos is configured
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")

        # check for the conversation_id, if the conversation is not set, we will create a new one
        if not conversation_id:
            raise Exception("No conversation_id found")

        # Format the incoming message object in the "chat/completions" messages format
        # then write it to the conversation history in cosmos
        messages = request_json["messages"]
        if len(messages) > 0 and messages[-1]["role"] == "assistant":
            if len(messages) > 1 and messages[-2].get("role", None) == "tool":
                # write the tool message first
                await current_app.cosmos_conversation_client.create_message(
                    uuid=str(uuid.uuid4()),
                    conversation_id=conversation_id,
                    user_id=user_id,
                    input_message=messages[-2],
                )
            # write the assistant message
            await current_app.cosmos_conversation_client.create_message(
                uuid=messages[-1]["id"],
                conversation_id=conversation_id,
                user_id=user_id,
                input_message=messages[-1],
            )
        else:
            raise Exception("No bot messages found")

        # Submit request to Chat Completions for response
        response = {"success": True}
        return jsonify(response), 200

    except Exception as e:
        logging.exception("Exception in /history/update")
        return jsonify({"error": str(e)}), 500


@bp.route("/history/message_feedback", methods=["POST"])
async def update_message():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # check request for message_id
    request_json = await request.get_json()
    message_id = request_json.get("message_id", None)
    message_feedback = request_json.get("message_feedback", None)
    try:
        if not message_id:
            return jsonify({"error": "message_id is required"}), 400

        if not message_feedback:
            return jsonify({"error": "message_feedback is required"}), 400

        # update the message in cosmos
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
    # get the user id from the request headers
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # check request for conversation_id
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    try:
        if not conversation_id:
            return jsonify({"error": "conversation_id is required"}), 400

        # make sure cosmos is configured
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")

        # delete the conversation messages from cosmos first
        deleted_messages = await current_app.cosmos_conversation_client.delete_messages(
            conversation_id, user_id
        )

        # Now delete the conversation
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
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # make sure cosmos is configured
    if not current_app.cosmos_conversation_client:
        raise Exception("CosmosDB is not configured or not working")

    # get the conversations from cosmos
    conversations = await current_app.cosmos_conversation_client.get_conversations(
        user_id, offset=offset, limit=25
    )
    if not isinstance(conversations, list):
        return jsonify({"error": f"No conversations for {user_id} were found"}), 404

    # return the conversation ids

    return jsonify(conversations), 200


@bp.route("/history/read", methods=["POST"])
async def get_conversation():
    await cosmos_db_ready.wait()
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # check request for conversation_id
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400

    # make sure cosmos is configured
    if not current_app.cosmos_conversation_client:
        raise Exception("CosmosDB is not configured or not working")

    # get the conversation object and the related messages from cosmos
    conversation = await current_app.cosmos_conversation_client.get_conversation(
        user_id, conversation_id
    )
    # return the conversation id and the messages in the bot frontend format
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
    conversation_messages = await current_app.cosmos_conversation_client.get_messages(
        user_id, conversation_id
    )

    # format the messages in the bot frontend format
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
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # check request for conversation_id
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400

    # make sure cosmos is configured
    if not current_app.cosmos_conversation_client:
        raise Exception("CosmosDB is not configured or not working")

    # get the conversation from cosmos
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

    # update the title
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
    # get the user id from the request headers
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # get conversations for user
    try:
        # make sure cosmos is configured
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")

        conversations = await current_app.cosmos_conversation_client.get_conversations(
            user_id, offset=0, limit=None
        )
        if not conversations:
            return jsonify({"error": f"No conversations for {user_id} were found"}), 404

        # delete each conversation
        for conversation in conversations:
            # delete the conversation messages from cosmos first
            deleted_messages = await current_app.cosmos_conversation_client.delete_messages(
                conversation["id"], user_id
            )

            # Now delete the conversation
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
    # get the user id from the request headers
    authenticated_user = get_authenticated_user_details(
        request_headers=request.headers)
    user_id = authenticated_user["user_principal_id"]

    # check request for conversation_id
    request_json = await request.get_json()
    conversation_id = request_json.get("conversation_id", None)

    try:
        if not conversation_id:
            return jsonify({"error": "conversation_id is required"}), 400

        # make sure cosmos is configured
        if not current_app.cosmos_conversation_client:
            raise Exception("CosmosDB is not configured or not working")

        # delete the conversation messages from cosmos
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


def limit_json_depth(obj, max_depth=2, current_depth=0):
    """Beschränkt die Tiefe des JSON-Objekts."""
    if current_depth >= max_depth:
        return "... (gekürzt)"  # Marker für abgeschnittene Daten

    if isinstance(obj, dict):
        return {k: limit_json_depth(v, max_depth, current_depth + 1) for k, v in obj.items()}

    if isinstance(obj, list):
        # Max 3 Elemente aus Listen
        return [limit_json_depth(v, max_depth, current_depth + 1) for v in obj[:3]]

    return obj  # Grundwerte unverändert zurückgeben


async def call_azure_logic_app(payload):
    logic_app_url = os.getenv("LOGIC_APP_URL")
    if not logic_app_url:
        raise ValueError("LOGIC_APP_URL is not set in environment variables.")

    headers = {"Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            logic_app_url, json=payload, headers=headers
        )
        response.raise_for_status()
        return response.json()


async def assistant_action_filter_candidates(azure_openai_client, thread_id, tool_call, run):
    """
    Filtert die besten 6 Kandidaten anhand ihrer Qualifikationen und Scores.
    """
    logging.info(
        "🚀 Funktion assistant_action_filter_candidates wurde aufgerufen!")
    try:
        # 🔥 Holt die gespeicherten bullhorn_result aus dem Thread
        stored_results = get_bullhorn_results()
        # ❌ Falls keine gespeicherten Kandidaten existieren, abbrechen
        """"
        if not stored_results or "candidates" not in stored_results:
            limited_results = limit_json_depth(stored_results, 2)
            logging.error(
                f"Es gibt keine gespeicherten Kandidaten zum Filtern. stored_results: {json.dumps(limited_results)[:200]}")
            return {"type": "filter_candidates", "error": "Keine gespeicherten Kandidaten gefunden."}
        """
        candidates = stored_results

        # 🔥 OpenAI mit dem Filtern beauftragen
        logging.debug(f"{len(candidates)} Kandidaten werden gefiltert...")
        await azure_openai_client.beta.threads.runs.submit_tool_outputs(
            thread_id=thread_id,
            run_id=run.id,
            tool_outputs=[
                {
                    "tool_call_id": tool_call.id,
                    "output": json.dumps({"candidates": candidates})
                }
            ]
        )
        logging.debug("Filter-Auftrag an OpenAI übermittelt.")

        # ✅ Korrekte Rückgabe speichern
        return {"type": "filtered_candidates", "content": json.dumps({"candidates": candidates})}

    except Exception as e:
        logging.exception(
            f"Fehler in assistant_action_filter_candidates, error:{e}")
        return {"type": "filter_candidates", "error": str(e)}


async def assistant_action_show_bullhorn_results(azure_openai_client, thread_id, tool_call, run):
    """
    Zeigt Kandidaten aus Bullhorn aus der Bullhorn-Suche an.
    """
    try:
        # 🔥 Bullhorn durchsuchen
        logging.info(
            f"Bullhorn-Ergebnisse werden angezeigt {thread_id}")
        # 🔥 Holt die gespeicherten bullhorn_result aus dem Thread
        stored_results = get_bullhorn_results()
        content = False

        if stored_results:
            limited_results = limit_json_depth(stored_results, 2)
            content = True
            # 🔥 OpenAI mit dem Filtern beauftragen
            logging.debug(
                f"XXXXXX-assistant_action_show_bullhorn_results Bullhorn-Ergebnisse: {json.dumps(limited_results)}")
        else:
            logging.error(
                "❌ Keine gespeicherten Bullhorn-Ergebnisse gefunden!")

        await azure_openai_client.beta.threads.runs.submit_tool_outputs(
            thread_id=thread_id,
            run_id=run.id,
            tool_outputs=[
                {
                    "tool_call_id": tool_call.id,
                    "output": json.dumps(stored_results)
                }
            ]
        )

        # ✅ Korrekte Rückgabe speichern
        return {"type": "show_bullhorn_results", "content": content}

    except Exception as e:
        logging.exception(
            f"Fehler in assistant_action_show_bullhorn_results: {e}")
        raise


async def assistant_action_bullhorn(azure_openai_client, thread_id, tool_call, run):
    """
    Holt Kandidaten aus Bullhorn und speichert sie im Thread.
    """
    try:
        # 🔥 Bullhorn durchsuchen
        logging.info(
            f"Bullhorn-Suche wird durchgeführt: {tool_call.function.arguments}")
        arguments = json.loads(tool_call.function.arguments)
        tool_result = await call_azure_logic_app({"searchQ": arguments["searchQ"]})

        # 🔥 Check, ob die Kandidaten zurückgegeben wurden
        if not tool_result or "candidates" not in tool_result:
            logging.error(
                "Keine Kandidaten in der Antwort von Bullhorn gefunden.")
            raise ValueError("Bullhorn-Suche hat keine Kandidaten gefunden.")

        # **Hier wird die Antwort zusammengefasst**
        summary_message = f"Es wurden {tool_result['count']} von {tool_result['total']} Kandidaten gefunden."
        logging.info(f"Tool result summary: {summary_message}")
        candidates = tool_result["candidates"]
        store_bullhorn_results(thread_id, tool_result)

        logging.info(
            "Bullhorn-Ergebnisse erfolgreich vor Abschluss des Runs gespeichert.")

        # **Ergebnis speichern (reduzierte Antwort)**
        await azure_openai_client.beta.threads.runs.submit_tool_outputs(
            thread_id=thread_id,
            run_id=run.id,
            tool_outputs=[
                {
                    "tool_call_id": tool_call.id,
                    "output": json.dumps(tool_result)
                }
            ]
        )
        logging.debug(
            f"✅ Tool-Outputs erfolgreich gespeichert: {json.dumps({'candidates': candidates})[:40]}")

        # **Antwort an den Assistenten zurückgeben**
        return {"type": "bullhorn_result", "content": summary_message}
    except Exception as e:
        logging.exception(f"Fehler in assistant_action_bullhorn: {e}")
        raise


async def assistant_action_handler(azure_openai_client, thread_id, run):
    """
    Behandelt 'requires_action'-Events für den Assistant.
    """
    tool_calls = run.required_action.submit_tool_outputs.tool_calls
    tool_call = tool_calls[0]
    requested_tool = tool_call.function.name

    logging.info(f"Run required actions: {run.required_action}")
    logging.debug(f"XXXXXXTool requested: {requested_tool}")
    for tool_call in tool_calls:
        logging.debug(f"XXXXXXTool requested: {tool_call.function.name}")
    logging.debug(
        f"XXXXXXExecuting tool with ID: {tool_call.id} requested by {requested_tool}")

    if requested_tool == "bullhorn_search":
        return await assistant_action_bullhorn(azure_openai_client, thread_id, tool_call, run)

    elif requested_tool == "filter_candidates":
        return await assistant_action_filter_candidates(azure_openai_client, thread_id, tool_call, run)

    elif requested_tool == "show_bullhorn_results":
        return await assistant_action_show_bullhorn_results(azure_openai_client, thread_id, tool_call, run)

    else:
        raise NotImplementedError(
            f"Tool '{requested_tool}' ist nicht implementiert.")

    # Nach der Aktion den Run erneut starten, falls nötig
    # return await wait_for_run_completion(azure_openai_client, thread_id, run.id)


async def run_completed_handler(azure_openai_client, thread_id, completed_actions):
    """
    Reagiert auf abgeschlossene Runs und verarbeitet die Ergebnisse.
    """
    try:
        for action in completed_actions:
            if not isinstance(action, dict):
                logging.error(
                    f"FEHLER: Ungültige Aktion in completed_actions: {type(action)} → {action}")
                continue  # Überspringe fehlerhafte Einträge
            if "content" not in action:
                raise KeyError(
                    f"Fehlende Property in action fuer {action['type']}: 'content'")
            if action["type"] == "show_bullhorn_results":
                if "content" in action:
                    # Debug-Ausgabe
                    logging.info(
                        f"Zeige Bullhorn-Ergebnisse an: {action['content']}")
            if action["type"] == "bullhorn_result":
                logging.info(
                    f"Zusammenfassung Bullhorn-Ergebnisse: {action['content']}")
                """
                await azure_openai_client.beta.threads.messages.create(
                    thread_id=thread_id,
                    role="assistant",
                    content=action["content"],
                    metadata={"type": "bullhorn_result"}
                )
                """
                logging.info("Bullhorn-Ergebnisse erfolgreich gespeichert.")

            if action["type"] == "filtered_candidates":
                # messages = await azure_openai_client.beta.threads.messages.list(thread_id=thread_id)
                candidates = action.get("output", {})  # .get("candidates", [])
                logging.debug(
                    f"✅ XXXXXXFilterung der Kandidaten erfolgreich! Output: {json.dumps(candidates)[:800]}")
                """
                await azure_openai_client.beta.threads.messages.create(
                    thread_id=thread_id,
                    role="assistant",
                    content=action["content"],
                    metadata={"type": "filtered_candidates"}
                )
                logging.info(
                    "Gefilterte Kandidaten erfolgreich gespeichert.")
                """

    except Exception as e:
        logging.exception(
            f"Fehler beim Speichern der Bullhorn-Ergebnisse: {e}")
        raise


async def wait_for_run_completion(azure_openai_client, thread_id, run_id, timeout=120):
    """
    Wartet auf die Fertigstellung des Assistant-Runs mit Timeout.
    Falls 'requires_action' auftritt, wird direkt assistant_action_handler() aufgerufen.
    """
    start_time = asyncio.get_event_loop().time()
    requires_action_handled = False  # Markiert, ob bereits eine Action gestartet wurde
    completed_actions = []  # ❗ Speichert alle nach dem Run benötigten Aktionen

    while True:
        if asyncio.get_event_loop().time() - start_time > timeout:
            raise TimeoutError(
                "Der Assistant-Run hat das Timeout überschritten.")

        run = await azure_openai_client.beta.threads.runs.retrieve(
            thread_id=thread_id,
            run_id=run_id
        )

        if run.status in ['completed', 'failed']:
            if run.status == 'completed':
                logging.info(
                    "Run abgeschlossen – run_completed_handler wird aufgerufen.")
                await run_completed_handler(azure_openai_client, thread_id, completed_actions)
                return run
            return run  # Erfolg oder Fehler

        if run.status == 'requires_action':
            if requires_action_handled:
                raise RuntimeError(
                    "Mehr als eine 'requires_action' erkannt! Mögliche Endlosschleife.")

            logging.debug(
                "XXXXXX-Requires action erkannt – assistant_action_handler wird aufgerufen.")
            # requires_action_handled = True  # Markiere, dass wir eine Action gestartet haben
            action_result = await assistant_action_handler(azure_openai_client, thread_id, run)

            if action_result:
                # Speichert Rückgaben für später
                completed_actions.append(action_result)

            continue  # Zurück zur Schleife, um den neuen Status zu prüfen

        await asyncio.sleep(2)


@bp.route("/assistant", methods=["POST"])
async def assistant_interaction():
    try:
        request_json = await request.get_json()
        user_input = request_json.get(
            "content", "Bitte durchsuche Bullhorn nach Managern aus der Solar-Branche.")
        logging.debug(f"User Input: {user_input}")

        azure_openai_client = await init_openai_client()
        assistant = await init_assistant_client()
        logging.debug(f"XXXXXXRegistered tools: {assistant.tools}")

        # Thread und Nachricht erstellen
        thread = await azure_openai_client.beta.threads.create()
        message = await azure_openai_client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=user_input
        )

        # Thread ausführen
        run = await azure_openai_client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant.id
        )

        # Warten, bis der Run abgeschlossen ist oder eine Aktion erforderlich ist
        run = await wait_for_run_completion(azure_openai_client, thread.id, run.id)

        if run.status == 'requires_action':
            await assistant_action_handler(azure_openai_client, thread.id, run)

            # Erneut auf Abschluss warten
            run = await wait_for_run_completion(azure_openai_client, thread.id, run.id)

        if run.status == 'completed':
            messages = await azure_openai_client.beta.threads.messages.list(thread_id=thread.id)
            return jsonify({
                "id": thread.id,
                "object": "chat.completion",
                "created": thread.created_at,
                "model": assistant.model,
                "choices": [
                    {
                        "messages": [
                            {
                                "role": m.role,
                                "content": "".join([block.text.value for block in m.content]),
                                "id": m.id,
                                "created_at": m.created_at
                            }
                            for m in messages.data
                        ]
                    }
                ]
            }), 200
        else:
            logging.error(
                f"Run failed: {run.status} {json.dumps(run.model_dump())}")
            return jsonify({
                "error": "Run failed",
                "status": run.status,
                # Pydantic-Modelle haben diese Methode
                "details": json.dumps(run.model_dump())
            }), 500

    except Exception as e:
        logging.exception(f"Error in /assistant interaction. e:{e}")
        return jsonify({"error": str(e)}), 500


async def generate_title(conversation_messages) -> str:
    # make sure the messages are sorted by _ts descending
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
