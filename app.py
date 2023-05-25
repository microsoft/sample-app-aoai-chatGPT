import os
import logging
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def static_file(path):
    return app.send_static_file(path)

# ACS Integration Settings
AZURE_SEARCH_SERVICE = os.environ.get("AZURE_SEARCH_SERVICE")
AZURE_SEARCH_INDEX = os.environ.get("AZURE_SEARCH_INDEX")
AZURE_SEARCH_KEY = os.environ.get("AZURE_SEARCH_KEY")
AZURE_SEARCH_USE_SEMANTIC_SEARCH = os.environ.get("AZURE_SEARCH_USE_SEMANTIC_SEARCH", False)
AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG = os.environ.get("AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG", "default")
AZURE_SEARCH_TOP_K = os.environ.get("AZURE_SEARCH_TOP_K", 5)
AZURE_SEARCH_ENABLE_IN_DOMAIN = os.environ.get("AZURE_SEARCH_ENABLE_IN_DOMAIN", "true")
AZURE_SEARCH_CONTENT_COLUMNS = os.environ.get("AZURE_SEARCH_CONTENT_COLUMNS")
AZURE_SEARCH_FILENAME_COLUMN = os.environ.get("AZURE_SEARCH_FILENAME_COLUMN")
AZURE_SEARCH_TITLE_COLUMN = os.environ.get("AZURE_SEARCH_TITLE_COLUMN")
AZURE_SEARCH_URL_COLUMN = os.environ.get("AZURE_SEARCH_URL_COLUMN")

# AOAI Integration Settings
AZURE_OPENAI_RESOURCE = os.environ.get("AZURE_OPENAI_RESOURCE")
AZURE_OPENAI_MODEL = os.environ.get("AZURE_OPENAI_MODEL")
AZURE_OPENAI_KEY = os.environ.get("AZURE_OPENAI_KEY")
AZURE_OPENAI_TEMPERATURE = os.environ.get("AZURE_OPENAI_TEMPERATURE", 0)
AZURE_OPENAI_TOP_P = os.environ.get("AZURE_OPENAI_TOP_P", 1.0)
AZURE_OPENAI_MAX_TOKENS = os.environ.get("AZURE_OPENAI_MAX_TOKENS", 1000)
AZURE_OPENAI_STOP_SEQUENCE = os.environ.get("AZURE_OPENAI_STOP_SEQUENCE")
AZURE_OPENAI_SYSTEM_MESSAGE = os.environ.get("AZURE_OPENAI_SYSTEM_MESSAGE", "You are an AI assistant that helps people find information.")
AZURE_OPENAI_PREVIEW_API_VERSION = os.environ.get("AZURE_OPENAI_PREVIEW_API_VERSION", "2023-06-01-preview")


def prepare_body_headers_with_data(request):
    request_messages = request.json["messages"]

    body = {
        "messages": request_messages,
        "temperature": AZURE_OPENAI_TEMPERATURE,
        "max_tokens": AZURE_OPENAI_MAX_TOKENS,
        "top_p": AZURE_OPENAI_TOP_P,
        "stop": AZURE_OPENAI_STOP_SEQUENCE.split("|") if AZURE_OPENAI_STOP_SEQUENCE else [],
        "stream": False,
        "dataSources": [
            {
                "type": "AzureCognitiveSearch",
                "parameters": {
                    "endpoint": f"https://{AZURE_SEARCH_SERVICE}.search.windows.net",
                    "key": AZURE_SEARCH_KEY,
                    "indexName": AZURE_SEARCH_INDEX,
                    "fieldsMapping": {
                        "contentField": AZURE_SEARCH_CONTENT_COLUMNS.split("|") if AZURE_SEARCH_CONTENT_COLUMNS else [],
                        "titleField": AZURE_SEARCH_TITLE_COLUMN if AZURE_SEARCH_TITLE_COLUMN else None,
                        "urlField": AZURE_SEARCH_URL_COLUMN if AZURE_SEARCH_URL_COLUMN else None,
                        "filepathField": AZURE_SEARCH_FILENAME_COLUMN if AZURE_SEARCH_FILENAME_COLUMN else None
                    },
                    "inScope": True if AZURE_SEARCH_ENABLE_IN_DOMAIN.lower() == "true" else False,
                    "topNDocuments": AZURE_SEARCH_TOP_K,
                    "queryType": "semantic" if AZURE_SEARCH_USE_SEMANTIC_SEARCH.lower() == "true" else "simple",
                    "semanticConfiguration": AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG if AZURE_SEARCH_USE_SEMANTIC_SEARCH.lower() == "true" and AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG else "",
                    "roleInformation": AZURE_OPENAI_SYSTEM_MESSAGE
                }
            }
        ]
    }
    
    headers = {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
        'chatgpt_url': f"https://{AZURE_OPENAI_RESOURCE}.openai.azure.com/openai/deployments/{AZURE_OPENAI_MODEL}/completions?api-version=2023-03-31-preview",
        'chatgpt_key': AZURE_OPENAI_KEY,
        "x-ms-useragent": "GitHubSampleWebApp/PublicAPI/1.0.0"
    }

    return body, headers

def prepare_body_headers_without_data(request):
    request_messages = request.json["messages"]
    body_messages = [
        {
            "role": "system",
            "content": AZURE_OPENAI_SYSTEM_MESSAGE
        }
    ]

    for message in request_messages:
        body_messages.append({
            "role": message["role"] ,
            "content": message["content"]
        })

    body = {
        "messages": body_messages,
        "temperature": float(AZURE_OPENAI_TEMPERATURE),
        "top_p": float(AZURE_OPENAI_TOP_P),
        "max_tokens": int(AZURE_OPENAI_MAX_TOKENS),
        "stream": False
    }

    headers = {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY
    }

    if AZURE_OPENAI_STOP_SEQUENCE:
        sequences = AZURE_OPENAI_STOP_SEQUENCE.split("|")
        body["stop"] = sequences

    return body, headers

def should_use_data():
    if AZURE_SEARCH_SERVICE and AZURE_SEARCH_INDEX and AZURE_SEARCH_KEY:
        return True
    return False

@app.route("/conversation", methods=["POST"])
def conversation():
    try:
        base_url = f"https://{AZURE_OPENAI_RESOURCE}.openai.azure.com"
        use_data = should_use_data()
        if use_data:
            body, headers = prepare_body_headers_with_data(request)
            endpoint = f"{base_url}/openai/deployments/{AZURE_OPENAI_MODEL}/extensions/chat/completions?api-version={AZURE_OPENAI_PREVIEW_API_VERSION}"
        else:
            body, headers = prepare_body_headers_without_data(request)
            endpoint = f"{base_url}/openai/deployments/{AZURE_OPENAI_MODEL}/chat/completions?api-version=2023-03-15-preview"

        r = requests.post(endpoint, headers=headers, json=body)
        status_code = r.status_code
        r = r.json()

        if not use_data and status_code == 200:
            # convert to the same format as the data version
            r["choices"][0]["messages"] = [{
                "content": r["choices"][0]["message"]["content"],
                "role": "assistant"
                }]

        return jsonify(r), status_code
    except Exception as e:
        logging.exception("Exception in /conversation")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
