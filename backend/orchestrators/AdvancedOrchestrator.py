import requests
import copy
import json
import logging
import openai
from flask import Response, request, jsonify
from .Orchestrator import Orchestrator
from .LoadBalancer import LoadBalancer

class AdvancedOrchestrator(Orchestrator):
    def __init__(self):
        # Create a LoadBalancer object
        self.load_balancer = LoadBalancer()
        
    # Post chat info if data configured
    def conversation_with_data(self, request_body, message_uuid):
        logging.debug(f"ADV ORCH COVO W/ DATA")
        # Get a weighted random OpenAIContext object
        openai_context = self.load_balancer.get_openai_context()

        logging.debug(f"OPENAI CONTEXT: {openai_context}")

        resource = openai_context["resource"]
        model = openai_context["model"]
        endpoint_url = openai_context["endpoint_url"]
        key = openai_context["key"]
        version = openai_context["version"]

        logging.debug(f"KEY: {key}")

        # Set up request variables
        body, headers = super().prepare_body_headers_with_data(request, key=key)
        base_url = endpoint_url if endpoint_url else f"https://{resource}.openai.azure.com/"
        endpoint = f"{base_url}openai/deployments/{model}/extensions/chat/completions?api-version={version}"
        history_metadata = request_body.get("history_metadata", {})
        history_metadata = super().conversation_client.create_conversation_item(request_body, super().AZURE_OPENAI_RESOURCE, super().AZURE_OPENAI_MODEL, super().AZURE_OPENAI_TEMPERATURE, history_metadata)

        # Return response if streaming is not enabled
        if not super().SHOULD_STREAM:
            r = requests.post(endpoint, headers=headers, json=body)
            status_code = r.status_code
            r = r.json()

            # Check for preview api version
            if version == "2023-06-01-preview":
                r['history_metadata'] = history_metadata
                super().conversation_client.log_non_stream(r)
                return Response(super().format_as_ndjson(r), status=status_code)
            else:
                result = super().formatApiResponseNoStreaming(r)
                result['history_metadata'] = history_metadata
                super().conversation_client.log_non_stream(result)
                return Response(super().format_as_ndjson(result), status=status_code)

        # Return response if streaming is enabled
        else:
            return Response(super().stream_with_data(body, headers, endpoint, message_uuid, history_metadata), mimetype='text/event-stream')

    # Post chat info if data not configured
    def conversation_without_data(self, request_body, message_uuid):
        # Get a weighted random OpenAIContext object
        openai_context = self.load_balancer.get_openai_context()

        resource = openai_context["resource"]
        model = openai_context["model"]
        endpoint_url = openai_context["endpoint_url"]
        key = openai_context["key"]
        version = openai_context["version"]

        # Setup for direct query to OpenAI
        openai.api_type = "azure"
        openai.api_base = endpoint_url if endpoint_url else f"https://{resource}.openai.azure.com/"
        openai.api_version = version
        openai.api_key = key

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

        history_metadata = request_body.get("history_metadata", {})
        history_metadata = super().conversation_client.create_conversation_item(
            request_body,
            super().AZURE_OPENAI_RESOURCE,
            super().AZURE_OPENAI_MODEL,
            super().AZURE_OPENAI_TEMPERATURE,
            history_metadata
        )
        
        # Send request to chat completion
        response = openai.ChatCompletion.create(
            engine=model,
            messages = messages,
            temperature=float(super().AZURE_OPENAI_TEMPERATURE),
            max_tokens=int(super().AZURE_OPENAI_MAX_TOKENS),
            top_p=float(super().AZURE_OPENAI_TOP_P),
            stop=super().AZURE_OPENAI_STOP_SEQUENCE.split("|") if super().AZURE_OPENAI_STOP_SEQUENCE else None,
            stream=super().SHOULD_STREAM
        )

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
            self.conversation_client.log_non_stream(response_obj)
            return jsonify(response_obj), 200
        
        # Format and return response if streaming is enabled
        else:
            return Response(super().stream_without_data(response, message_uuid, history_metadata), mimetype='text/event-stream')
