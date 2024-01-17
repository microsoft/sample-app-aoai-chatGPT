from .Orchestrator import Orchestrator
import requests
import openai
from flask import  Response, request, jsonify

class DefaultOrchestrator(Orchestrator):
    # Post chat info if data configured
    def conversation_with_data(self, request_body, message_uuid):
        # Set up request variables
        body, headers = super().prepare_body_headers_with_data(request)
        base_url = super().AZURE_OPENAI_ENDPOINT if super().AZURE_OPENAI_ENDPOINT else f"https://{super().AZURE_OPENAI_RESOURCE}.openai.azure.com/"
        endpoint = f"{base_url}openai/deployments/{super().AZURE_OPENAI_MODEL}/extensions/chat/completions?api-version={super().AZURE_OPENAI_PREVIEW_API_VERSION}"
        history_metadata = request_body.get("history_metadata", {})

        # Return response if streaming is not enabled
        if not super().SHOULD_STREAM:
            r = requests.post(endpoint, headers=headers, json=body)
            status_code = r.status_code
            r = r.json()

            # Check for preview api version
            if super().AZURE_OPENAI_PREVIEW_API_VERSION == "2023-06-01-preview":
                r['history_metadata'] = history_metadata
                return Response(super().format_as_ndjson(r), status=status_code)
            else:
                result = super().formatApiResponseNoStreaming(r)
                result['history_metadata'] = history_metadata
                return Response(super().format_as_ndjson(result), status=status_code)

        # Return response if streaming is enabled
        else:
            return Response(super().stream_with_data(body, headers, endpoint, message_uuid,  history_metadata), mimetype='text/event-stream')

    # Post chat info if data not configured
    def conversation_without_data(self, request_body, message_uuid):
        # Setup for direct query to OpenAI
        openai.api_type = "azure"
        openai.api_base = super().AZURE_OPENAI_ENDPOINT if super().AZURE_OPENAI_ENDPOINT else f"https://{super().AZURE_OPENAI_RESOURCE}.openai.azure.com/"
        openai.api_version = "2023-08-01-preview"
        openai.api_key = super().AZURE_OPENAI_KEY

        # Configure request
        request_messages = request_body["messages"]
        messages = [
            {
                "role": "system",
                "content": super().AZURE_OPENAI_SYSTEM_MESSAGE
            }
        ]

        for message in request_messages:
            if message:
                messages.append({
                    "role": message["role"] ,
                    "content": message["content"]
                })

        # Send request to chat completion
        response = openai.ChatCompletion.create(
            engine=super().AZURE_OPENAI_MODEL,
            messages = messages,
            temperature=float(super().AZURE_OPENAI_TEMPERATURE),
            max_tokens=int(super().AZURE_OPENAI_MAX_TOKENS),
            top_p=float(super().AZURE_OPENAI_TOP_P),
            stop=super().AZURE_OPENAI_STOP_SEQUENCE.split("|") if super().AZURE_OPENAI_STOP_SEQUENCE else None,
            stream=super().SHOULD_STREAM
        )

        history_metadata = request_body.get("history_metadata", {})

        # Format and return response if streaming is not enabled
        if not super().SHOULD_STREAM:
            response_obj = {
                "id": message_uuid,
                "model": response.model,
                "created": response.created,
                "object": response.object,
                "choices": [{
                    "messages": [{
                        "role": "assistant",
                        "content": response.choices[0].message.content
                    }]
                }],
                "history_metadata": history_metadata
            }

            return jsonify(response_obj), 200
        
        # Format and return response if streaming is enabled
        else:
            return Response(super().stream_without_data(response, history_metadata, message_uuid), mimetype='text/event-stream')
