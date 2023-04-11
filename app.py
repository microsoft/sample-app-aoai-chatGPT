import os
import logging
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def static_file(path):
    return app.send_static_file(path)

# ACS Integration Settings
AZURE_SEARCH_SERVICE = os.environ.get("AZURE_SEARCH_SERVICE")
AZURE_SEARCH_INDEX = os.environ.get("AZURE_SEARCH_INDEX")
AZURE_SEARCH_KEY = os.environ.get("AZURE_SEARCH_KEY")
AZURE_SEARCH_USE_SEMANTIC_SEARCH = os.environ.get("AZURE_SEARCH_USE_SEMANTIC_SEARCH")
AZURE_SEARCH_INDEX_IS_PRECHUNKED = os.environ.get("AZURE_SEARCH_INDEX_IS_PRECHUNKED")
AZURE_SEARCH_TOP_K = os.environ.get("AZURE_SEARCH_TOP_K", 5)
AZURE_SEARCH_ENABLE_IN_DOMAIN = os.environ.get("AZURE_SEARCH_ENABLE_IN_DOMAIN", False)

# AOAI Integration Settings
AZURE_OPENAI_RESOURCE = os.environ.get("AZURE_OPENAI_RESOURCE")
AZURE_OPENAI_MODEL = os.environ.get("AZURE_OPENAI_MODEL")
AZURE_OPENAI_KEY = os.environ.get("AZURE_OPENAI_KEY")
AZURE_OPENAI_DEPLOYMENT = os.environ.get("AZURE_OPENAI_DEPLOYMENT")
AZURE_OPENAI_TEMPERATURE = os.environ.get("AZURE_OPENAI_TEMPERATURE", 0)
AZURE_OPENAI_TOP_P = os.environ.get("AZURE_OPENAI_TOP_P", 1.0)
AZURE_OPENAI_MAX_TOKENS = os.environ.get("AZURE_OPENAI_MAX_TOKENS", 1000)
AZURE_OPENAI_STOP_SEQUENCE = os.environ.get("AZURE_OPENAI_STOP_SEQUENCE")

# Private API Management Key (temporary)
AZURE_APIM_KEY = os.environ.get("AZURE_APIM_KEY")

@app.route("/conversation", methods=["POST"])
def conversation():
    try:
        messages = request.json["messages"]
        body = {
            "messages": messages,
            "enable_Indomain": AZURE_SEARCH_ENABLE_IN_DOMAIN,
            "azure_document_search_top_k": AZURE_SEARCH_TOP_K,
            "temperature": AZURE_OPENAI_TEMPERATURE,
            "top_p": AZURE_OPENAI_TOP_P,
            "max_tokens": AZURE_OPENAI_MAX_TOKENS
        }

        if AZURE_OPENAI_STOP_SEQUENCE:
            sequences = AZURE_OPENAI_STOP_SEQUENCE.split("|")
            body["stop"] = sequences
        
        if AZURE_OPENAI_DEPLOYMENT:
            body["deployment"] = AZURE_OPENAI_DEPLOYMENT

        azure_openai_url = f"https://{AZURE_OPENAI_RESOURCE}.openai.azure.com/openai/deployments/{AZURE_OPENAI_MODEL}/completions?api-version=2022-12-01"
        search_url = f"https://{AZURE_SEARCH_SERVICE}.search.windows.net"

        headers = {
            "Content-Type": "application/json",
            "azure_document_search_url": search_url,
            "azure_document_search_api_key": AZURE_SEARCH_KEY,
            "azure_document_search_index": AZURE_SEARCH_INDEX,
            "azure_document_is_prechunked": AZURE_SEARCH_INDEX_IS_PRECHUNKED,
            "chatgpt_url": azure_openai_url,
            "chatgpt_key": AZURE_OPENAI_KEY,
            "Ocp-Apim-Subscription-Key": AZURE_APIM_KEY,
            "azure_document_search_configuration": "default" if AZURE_SEARCH_USE_SEMANTIC_SEARCH else "",
            "azure_document_search_query_type": "semantic" if AZURE_SEARCH_USE_SEMANTIC_SEARCH else "simple"
        }

        endpoint = "https://echatpgtameuse.azure-api.net/svc/inferenceservice/conversation"
        r = requests.post(endpoint, headers=headers, json=body)
        r = r.json()

        return jsonify(r)
    except Exception as e:
        logging.exception("Exception in /conversation")
        return jsonify({"error": str(e)}), 500

@app.route("/feedback", methods=["POST"])
def feedback():
    try:
        headers = {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": AZURE_APIM_KEY
        }
        endpoint = "https://echatpgtameuse.azure-api.net/svc/inferenceservice/feedback"
        r = requests.post(endpoint, headers=headers, json=request.json)
        return jsonify({"status": r.status_code, "ok": r.ok})
    except Exception as e:
        logging.exception("Exception in /feedback")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run()
