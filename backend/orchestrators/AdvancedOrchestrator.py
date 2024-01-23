import requests
import os
import copy
import json
import logging
import openai
from flask import Response, request, jsonify
from .Orchestrator import Orchestrator
from .LoadBalancer import LoadBalancer

class AdvancedOrchestrator(Orchestrator):
    # Post chat info if data configured
    def conversation_with_data(self, request_body, message_uuid):
        # Create a LoadBalancer object
        load_balancer = LoadBalancer()

        # Get a weighted random OpenAIContext object
        openai_context = load_balancer.get_openai_context()

        resource = openai_context["resource"]
        model = openai_context["model"]
        endpoint_url = openai_context["endpoint_url"]
        key = openai_context["key"]
        version = openai_context["version"]

        # Set up request variables
        body, headers = self.prepare_body_headers_with_data(request, key)
        base_url = endpoint_url if endpoint_url else f"https://{resource}.openai.azure.com/"
        endpoint = f"{base_url}openai/deployments/{model}/extensions/chat/completions?api-version={version}"
        history_metadata = request_body.get("history_metadata", {})

        # Return response if streaming is not enabled
        if not super().SHOULD_STREAM:
            r = requests.post(endpoint, headers=headers, json=body)
            status_code = r.status_code
            r = r.json()

            # Check for preview api version
            if version == "2023-06-01-preview":
                r['history_metadata'] = history_metadata
                return Response(super().format_as_ndjson(r), status=status_code)
            else:
                result = super().formatApiResponseNoStreaming(r)
                result['history_metadata'] = history_metadata
                return Response(super().format_as_ndjson(result), status=status_code)

        # Return response if streaming is enabled
        else:
            return Response(super().stream_with_data(body, headers, endpoint, message_uuid, history_metadata), mimetype='text/event-stream')

    # Post chat info if data not configured
    def conversation_without_data(self, request_body, message_uuid):
        # Create a LoadBalancer object
        load_balancer = LoadBalancer()

        # Get a weighted random OpenAIContext object
        openai_context = load_balancer.get_openai_context()

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
            return Response(super().stream_without_data(response, message_uuid, history_metadata), mimetype='text/event-stream')
        
    # Format request body and headers with relevant info based on search type
    def prepare_body_headers_with_data(self, request, key):
        request_messages = request.json["messages"]

        body = {
            "messages": request_messages,
            "temperature": float(super().AZURE_OPENAI_TEMPERATURE),
            "max_tokens": int(super().AZURE_OPENAI_MAX_TOKENS),
            "top_p": float(super().AZURE_OPENAI_TOP_P),
            "stop": super().AZURE_OPENAI_STOP_SEQUENCE.split("|") if super().AZURE_OPENAI_STOP_SEQUENCE else None,
            "stream": super().SHOULD_STREAM,
            "dataSources": []
        }

        if super().DATASOURCE_TYPE == "AzureCognitiveSearch":
            # Set query type
            query_type = "simple"
            if super().AZURE_SEARCH_QUERY_TYPE:
                query_type = super().AZURE_SEARCH_QUERY_TYPE
            elif super().AZURE_SEARCH_USE_SEMANTIC_SEARCH.lower() == "true" and super().AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG:
                query_type = "semantic"

            # Set filter
            filter = None
            userToken = None
            if super().AZURE_SEARCH_PERMITTED_GROUPS_COLUMN:
                userToken = request.headers.get('X-MS-TOKEN-AAD-ACCESS-TOKEN', "")
                if super().DEBUG_LOGGING:
                    logging.debug(f"USER TOKEN is {'present' if userToken else 'not present'}")

                filter = super().generateFilterString(userToken)
                if super().DEBUG_LOGGING:
                    logging.debug(f"FILTER: {filter}")

            body["dataSources"].append(
                {
                    "type": "AzureCognitiveSearch",
                    "parameters": {
                        "endpoint": f"https://{super().AZURE_SEARCH_SERVICE}.search.windows.net",
                        "key": super().AZURE_SEARCH_KEY,
                        "indexName": super().AZURE_SEARCH_INDEX,
                        "fieldsMapping": {
                            "contentFields": super().parse_multi_columns(super().AZURE_SEARCH_CONTENT_COLUMNS) if super().AZURE_SEARCH_CONTENT_COLUMNS else [],
                            "titleField": super().AZURE_SEARCH_TITLE_COLUMN if super().AZURE_SEARCH_TITLE_COLUMN else None,
                            "urlField": super().AZURE_SEARCH_URL_COLUMN if super().AZURE_SEARCH_URL_COLUMN else None,
                            "filepathField": super().AZURE_SEARCH_FILENAME_COLUMN if super().AZURE_SEARCH_FILENAME_COLUMN else None,
                            "vectorFields": super().parse_multi_columns(super().AZURE_SEARCH_VECTOR_COLUMNS) if super().AZURE_SEARCH_VECTOR_COLUMNS else []
                        },
                        "inScope": True if super().AZURE_SEARCH_ENABLE_IN_DOMAIN.lower() == "true" else False,
                        "topNDocuments": int(super().AZURE_SEARCH_TOP_K),
                        "queryType": query_type,
                        "semanticConfiguration": super().AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG if super().AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG else "",
                        "roleInformation": super().AZURE_OPENAI_SYSTEM_MESSAGE,
                        "filter": filter,
                        "strictness": int(super().AZURE_SEARCH_STRICTNESS)
                    }
                })
        elif super().DATASOURCE_TYPE == "AzureCosmosDB":
            # Set query type
            query_type = "vector"

            body["dataSources"].append(
                {
                    "type": "AzureCosmosDB",
                    "parameters": {
                        "connectionString": super().AZURE_COSMOSDB_MONGO_VCORE_CONNECTION_STRING,
                        "indexName": super().AZURE_COSMOSDB_MONGO_VCORE_INDEX,
                        "databaseName": super().AZURE_COSMOSDB_MONGO_VCORE_DATABASE,
                        "containerName": super().AZURE_COSMOSDB_MONGO_VCORE_CONTAINER,                    
                        "fieldsMapping": {
                            "contentFields": super().parse_multi_columns(super().AZURE_COSMOSDB_MONGO_VCORE_CONTENT_COLUMNS) if super().AZURE_COSMOSDB_MONGO_VCORE_CONTENT_COLUMNS else [],
                            "titleField": super().AZURE_COSMOSDB_MONGO_VCORE_TITLE_COLUMN if super().AZURE_COSMOSDB_MONGO_VCORE_TITLE_COLUMN else None,
                            "urlField": super().AZURE_COSMOSDB_MONGO_VCORE_URL_COLUMN if super().AZURE_COSMOSDB_MONGO_VCORE_URL_COLUMN else None,
                            "filepathField": super().AZURE_COSMOSDB_MONGO_VCORE_FILENAME_COLUMN if super().AZURE_COSMOSDB_MONGO_VCORE_FILENAME_COLUMN else None,
                            "vectorFields": super().parse_multi_columns(super().AZURE_COSMOSDB_MONGO_VCORE_VECTOR_COLUMNS) if super().AZURE_COSMOSDB_MONGO_VCORE_VECTOR_COLUMNS else []
                        },
                        "inScope": True if super().AZURE_COSMOSDB_MONGO_VCORE_ENABLE_IN_DOMAIN.lower() == "true" else False,
                        "topNDocuments": int(super().AZURE_COSMOSDB_MONGO_VCORE_TOP_K),
                        "strictness": int(super().AZURE_COSMOSDB_MONGO_VCORE_STRICTNESS),
                        "queryType": query_type,
                        "roleInformation": super().AZURE_OPENAI_SYSTEM_MESSAGE
                    }
                }
            )

        elif super().DATASOURCE_TYPE == "Elasticsearch":
            body["dataSources"].append(
                {
                    "messages": request_messages,
                    "temperature": float(super().AZURE_OPENAI_TEMPERATURE),
                    "max_tokens": int(super().AZURE_OPENAI_MAX_TOKENS),
                    "top_p": float(super().AZURE_OPENAI_TOP_P),
                    "stop": super().AZURE_OPENAI_STOP_SEQUENCE.split("|") if super().AZURE_OPENAI_STOP_SEQUENCE else None,
                    "stream": super().SHOULD_STREAM,
                    "dataSources": [
                        {
                            "type": "AzureCognitiveSearch",
                            "parameters": {
                                "endpoint": super().ELASTICSEARCH_ENDPOINT,
                                "encodedApiKey": super().ELASTICSEARCH_ENCODED_API_KEY,
                                "indexName": super().ELASTICSEARCH_INDEX,
                                "fieldsMapping": {
                                    "contentFields": super().parse_multi_columns(super().ELASTICSEARCH_CONTENT_COLUMNS) if super().ELASTICSEARCH_CONTENT_COLUMNS else [],
                                    "titleField": super().ELASTICSEARCH_TITLE_COLUMN if super().ELASTICSEARCH_TITLE_COLUMN else None,
                                    "urlField": super().ELASTICSEARCH_URL_COLUMN if super().ELASTICSEARCH_URL_COLUMN else None,
                                    "filepathField": super().ELASTICSEARCH_FILENAME_COLUMN if super().ELASTICSEARCH_FILENAME_COLUMN else None,
                                    "vectorFields": super().parse_multi_columns(super().ELASTICSEARCH_VECTOR_COLUMNS) if super().ELASTICSEARCH_VECTOR_COLUMNS else []
                                },
                                "inScope": True if super().ELASTICSEARCH_ENABLE_IN_DOMAIN.lower() == "true" else False,
                                "topNDocuments": int(super().ELASTICSEARCH_TOP_K),
                                "queryType": super().ELASTICSEARCH_QUERY_TYPE,
                                "roleInformation": super().AZURE_OPENAI_SYSTEM_MESSAGE,
                                "embeddingEndpoint": super().AZURE_OPENAI_EMBEDDING_ENDPOINT,
                                "embeddingKey": super().AZURE_OPENAI_EMBEDDING_KEY,
                                "embeddingModelId": super().ELASTICSEARCH_EMBEDDING_MODEL_ID,
                                "strictness": int(super().ELASTICSEARCH_STRICTNESS)
                            }
                        }
                    ]
                }
            )
        else:
            raise Exception(f"DATASOURCE_TYPE is not configured or unknown: {super().DATASOURCE_TYPE}")

        if "vector" in query_type.lower():
            if super().AZURE_OPENAI_EMBEDDING_NAME:
                body["dataSources"][0]["parameters"]["embeddingDeploymentName"] = super().AZURE_OPENAI_EMBEDDING_NAME
            else:
                body["dataSources"][0]["parameters"]["embeddingEndpoint"] = super().AZURE_OPENAI_EMBEDDING_ENDPOINT
                body["dataSources"][0]["parameters"]["embeddingKey"] = super().AZURE_OPENAI_EMBEDDING_KEY

        if super().DEBUG_LOGGING:
            body_clean = copy.deepcopy(body)
            if body_clean["dataSources"][0]["parameters"].get("key"):
                body_clean["dataSources"][0]["parameters"]["key"] = "*****"
            if body_clean["dataSources"][0]["parameters"].get("connectionString"):
                body_clean["dataSources"][0]["parameters"]["connectionString"] = "*****"
            if body_clean["dataSources"][0]["parameters"].get("embeddingKey"):
                body_clean["dataSources"][0]["parameters"]["embeddingKey"] = "*****"
                
            logging.debug(f"REQUEST BODY: {json.dumps(body_clean, indent=4)}")

        headers = {
            'Content-Type': 'application/json',
            'api-key': key,
            "x-ms-useragent": "GitHubSampleWebApp/PublicAPI/3.0.0"
        }

        return body, headers
