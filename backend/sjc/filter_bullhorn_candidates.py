import time
import json
import logging
import asyncio
import os
from openai import AsyncAzureOpenAI
import httpx
from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
from backend.settings import app_settings, MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION
from quart import jsonify, request


USER_AGENT = "GitHubSampleWebApp/AsyncAzureOpenAI/1.0.0"

BULLHORN_RESULTS = {}
THREAD_ID = None


def store_bullhorn_results(thread_id, candidates, ttl=600):
    global THREAD_ID
    expiry = time.time() + ttl
    THREAD_ID = thread_id
    logging.debug(f"XXXXXXstore_bullhorn_results(thread_id={THREAD_ID})")
    BULLHORN_RESULTS[THREAD_ID] = {"data": candidates, "expiry": expiry}


def get_bullhorn_results():
    global THREAD_ID
    logging.debug(
        f"XXXXXXget_bullhorn_results(thread_id={THREAD_ID})")
    if THREAD_ID and THREAD_ID in BULLHORN_RESULTS:
        return BULLHORN_RESULTS[THREAD_ID]["data"]
    return None


def cleanup_bullhorn_results():
    """Regelmäßige Bereinigung alter Einträge."""
    global THREAD_ID
    now = time.time()
    expired_keys = [k for k, v in BULLHORN_RESULTS.items() if isinstance(v, dict) and v.get("expiry", 0) < now]
    for key in expired_keys:
        del BULLHORN_RESULTS[key]  # ❌ Löschen
        if key == THREAD_ID:  # Falls der aktuelle THREAD_ID gelöscht wird
            THREAD_ID = None  # Zurücksetzen


async def init_openai_client():
    azure_openai_client = None

    try:

        # API version check
        if (
            app_settings.azure_openai.preview_api_version < MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION
        ):
            raise ValueError(
                f"The minimum supported Azure OpenAI preview API version is "
                f"'{MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION}'"
            )

        # Endpoint
        if (
            not app_settings.azure_openai.endpoint and not app_settings.azure_openai.resource
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
        logging.debug("XXXXXX - init_assistant_client - CLEANUP")
        cleanup_bullhorn_results()

        # Lesen des Prompts aus der Datei
        with open(os.path.join(os.path.dirname(__file__), 'system_message.txt'), 'r', encoding='utf-8') as file:
            system_message = file.read()

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
                                "filterQ": {
                                    "type": "string",
                                    "description": (
                                        "Filterbedingungen, z. B. 'nicht älter als 35' "
                                        "oder 'mit Erfahrung in Java'."
                                    )
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
        logging.exception(f"Exception in Assistant Initialization {e}")
        raise e


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
        if not stored_results or "candidates" not in stored_results:
            limited_results = limit_json_depth(stored_results, 2)
            logging.error(
                f"Es gibt keine gespeicherten Kandidaten zum Filtern. "
                f"stored_results: {json.dumps(limited_results)[:200]}")
            return {"type": "filter_candidates", "error": "Keine gespeicherten Kandidaten gefunden."}
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


async def filter_bullhorn_candidates_with_openai_functions():
    request_json = await request.get_json()
    user_input = request_json.get(
        "content", "Bitte durchsuche Bullhorn nach Managern aus der Solar-Branche.")
    logging.debug(f"User Input: {user_input}")

    azure_openai_client = await init_openai_client()
    assistant = await init_assistant_client()
    logging.debug(f"XXXXXXRegistered tools: {assistant.tools}")

    # Thread und Nachricht erstellen
    thread = await azure_openai_client.beta.threads.create()
    await azure_openai_client.beta.threads.messages.create(
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
            "details": json.dumps(run.model_dump())
        }), 500
