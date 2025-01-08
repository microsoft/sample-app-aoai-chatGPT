import os
import json
import logging
from flask import Flask, request, jsonify
from google.cloud import discoveryengine_v1beta
from google.oauth2 import service_account
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Google Agent Builder Configuration
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_AGENT_ID = os.getenv("GOOGLE_AGENT_ID")
GOOGLE_LOCATION = os.getenv("GOOGLE_LOCATION", "us-central1")
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Initialize Google Client
try:
    credentials = service_account.Credentials.from_service_account_file(GOOGLE_CREDENTIALS_PATH)
    agent_client = discoveryengine_v1beta.ConversationalSearchServiceClient(
        credentials=credentials
    )
    agent_path = agent_client.search_engine_path(
        project=GOOGLE_PROJECT_ID,
        location=GOOGLE_LOCATION,
        search_engine=GOOGLE_AGENT_ID
    )
except Exception as e:
    logging.error(f"Failed to initialize Google Agent client: {str(e)}")
    raise

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def static_file(path):
    return app.send_static_file(path)

@app.route("/chat", methods=["POST"])
def chat():
    try:
        request_body = request.json
        conversation = request_body.get("messages", [])
        stream = request_body.get("stream", False)

        if not conversation:
            return jsonify({"error": "No messages provided"}), 400

        # Format conversation history
        conversation_message = discoveryengine_v1beta.types.TextInput(
            text=conversation[-1]["content"]
        )

        serving_config = agent_client.serving_config_path(
            project=GOOGLE_PROJECT_ID,
            location=GOOGLE_LOCATION,
            data_store=GOOGLE_AGENT_ID,
            serving_config="default_config"
        )

        # Create the conversation request
        request = discoveryengine_v1beta.types.ConversationalSearchRequest(
            serving_config=serving_config,
            query=conversation_message
        )

        # Make the API call
        try:
            response = agent_client.converse(request)
        except Exception as e:
            logging.error(f"Error calling Google Agent: {str(e)}")
            return jsonify({"error": f"Failed to get response from Google Agent: {str(e)}"}), 500

        # Format the response
        chat_response = {
            "choices": [{
                "messages": [{
                    "role": "assistant",
                    "content": response.reply.text
                }]
            }]
        }

        if hasattr(response.reply, 'attribution') and response.reply.attribution:
            chat_response["choices"][0]["messages"][0]["citations"] = [
                {
                    "content": source.content,
                    "title": source.uri if hasattr(source, 'uri') else None,
                    "url": source.uri if hasattr(source, 'uri') else None,
                } for source in response.reply.attribution
            ]

        return jsonify(chat_response)

    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()