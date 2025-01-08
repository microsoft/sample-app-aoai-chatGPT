import os
import json
import logging
from flask import Flask, request, jsonify
from google.cloud import discoveryengine
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
    agent_client = discoveryengine.AgentServiceClient(credentials=credentials)
    agent_path = agent_client.agent_path(
        project=GOOGLE_PROJECT_ID,
        location=GOOGLE_LOCATION,
        collection="default_collection",
        data_store=GOOGLE_AGENT_ID
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

        print("Received conversation:", conversation)

        if not conversation:
            return jsonify({"error": "No messages provided"}), 400

        # Format conversation history for Google Agent
        formatted_messages = [{
            "author": msg["role"],
            "content": msg["content"]
        } for msg in conversation]
        
         # Request payload
        payload = {
            "query": {
                "text": formatted_messages[-1]["content"],
                "queryId": ""
            },
            "session": session,
            "relatedQuestionsSpec": {
                "enable": True
            },
            "answerGenerationSpec": {
                "ignoreAdversarialQuery": False,
                "ignoreNonAnswerSeekingQuery": False,
                "ignoreLowRelevantContent": False,
                "includeCitations": True,
                "promptSpec": {
                    "preamble": "You are a Northramp director preparing documentation for a response to a request for information. You are an expert sales strategist tasked with crafting a response to a Request for Information(RFP or RFI).The RFP outlines several key requirements and preferences. Please generate a draft proposal response that aligns with these requirements, highlights our unique selling propositions, and addresses potential client concerns, as well as Northramp past performance that reflects experience against the requirements"
                },
                "modelSpec": {
                    "modelVersion": "gemini-1.5-flash-002/answer_gen/v1"
                }
            }
        }

        # Prepare the request for Google Agent
        agent_request = discoveryengine.ConverseAgentRequest(
            agent=agent_path,
            query=formatted_messages[-1]["content"],
            # context={
            #     "messages": formatted_messages[:-1]
            # }
            answerGenerationSpec={
                "ignoreAdversarialQuery": False,
                "ignoreNonAnswerSeekingQuery": False,
                "ignoreLowRelevantContent": False,
                "includeCitations": True,
                "promptSpec": {
                    "preamble": "You are a Northramp director preparing documentation. You are an expert sales strategist"
                },
                "modelSpec": {
                    "modelVersion": "gemini-1.5-flash-002/answer_gen/v1"
                }
            }
        )

        # Make the API call
        try:
            response = agent_client.converse_agent(agent_request)
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

        if hasattr(response, 'citations') and response.citations:
            chat_response["choices"][0]["messages"][0]["citations"] = [
                {
                    "content": citation.content,
                    "title": citation.title if hasattr(citation, 'title') else None,
                    "url": citation.url if hasattr(citation, 'url') else None,
                } for citation in response.citations
            ]

        return jsonify(chat_response)

    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()