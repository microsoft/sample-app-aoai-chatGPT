from abc import ABC, abstractmethod
import os
import json
import logging
import requests
import copy
from dotenv import load_dotenv

from backend.conversationtelemetry import ConversationTelemetryClient

class Orchestrator(ABC):
    load_dotenv()

    DEBUG = os.environ.get("DEBUG", "false")
    DEBUG_LOGGING = DEBUG.lower() == "true"

    @abstractmethod
    def conversation_with_data(self, request_body, message_uuid):
        pass

    @abstractmethod
    def conversation_without_data(self, request_body, message_uuid):
        pass

    # Initialize search variables
    DATASOURCE_TYPE = os.environ.get("DATASOURCE_TYPE", "AzureCognitiveSearch")
    SEARCH_TOP_K = os.environ.get("SEARCH_TOP_K", 5)
    SEARCH_STRICTNESS = os.environ.get("SEARCH_STRICTNESS", 3)
    SEARCH_ENABLE_IN_DOMAIN = os.environ.get("SEARCH_ENABLE_IN_DOMAIN", "true")

    # Azure OpenAI Settings
    AZURE_OPENAI_TEMPERATURE = os.environ.get("AZURE_OPENAI_TEMPERATURE", 0)
    AZURE_OPENAI_EMBEDDING_ENDPOINT = os.environ.get("AZURE_OPENAI_EMBEDDING_ENDPOINT")
    AZURE_OPENAI_MAX_TOKENS = os.environ.get("AZURE_OPENAI_MAX_TOKENS", 1000)
    AZURE_OPENAI_MODEL = os.environ.get("AZURE_OPENAI_MODEL")
    AZURE_OPENAI_TOP_P = os.environ.get("AZURE_OPENAI_TOP_P", 1.0)
    AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_STOP_SEQUENCE = os.environ.get("AZURE_OPENAI_STOP_SEQUENCE")
    AZURE_OPENAI_STREAM = os.environ.get("AZURE_OPENAI_STREAM", "true")
    AZURE_OPENAI_EMBEDDING_KEY = os.environ.get("AZURE_OPENAI_EMBEDDING_KEY")
    AZURE_OPENAI_KEY = os.environ.get("AZURE_OPENAI_KEY")
    AZURE_OPENAI_EMBEDDING_NAME = os.environ.get("AZURE_OPENAI_EMBEDDING_NAME", "")
    AZURE_OPENAI_RESOURCE = os.environ.get("AZURE_OPENAI_RESOURCE")
    AZURE_OPENAI_PREVIEW_API_VERSION = os.environ.get("AZURE_OPENAI_PREVIEW_API_VERSION", "2023-08-01-preview")
    AZURE_OPENAI_SYSTEM_MESSAGE = os.environ.get("AZURE_OPENAI_SYSTEM_MESSAGE", "You are an AI assistant that helps people find information.")

    # Azure Search Settings
    AZURE_SEARCH_QUERY_TYPE = os.environ.get("AZURE_SEARCH_QUERY_TYPE")
    AZURE_SEARCH_USE_SEMANTIC_SEARCH = os.environ.get("AZURE_SEARCH_USE_SEMANTIC_SEARCH", "false")
    AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG = os.environ.get("AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG", "default")
    AZURE_SEARCH_PERMITTED_GROUPS_COLUMN = os.environ.get("AZURE_SEARCH_PERMITTED_GROUPS_COLUMN")
    AZURE_SEARCH_SERVICE = os.environ.get("AZURE_SEARCH_SERVICE")
    AZURE_SEARCH_KEY = os.environ.get("AZURE_SEARCH_KEY")
    AZURE_SEARCH_INDEX = os.environ.get("AZURE_SEARCH_INDEX")
    AZURE_SEARCH_CONTENT_COLUMNS = os.environ.get("AZURE_SEARCH_CONTENT_COLUMNS")
    AZURE_SEARCH_TITLE_COLUMN = os.environ.get("AZURE_SEARCH_TITLE_COLUMN")
    AZURE_SEARCH_URL_COLUMN = os.environ.get("AZURE_SEARCH_URL_COLUMN")
    AZURE_SEARCH_FILENAME_COLUMN = os.environ.get("AZURE_SEARCH_FILENAME_COLUMN")
    AZURE_SEARCH_VECTOR_COLUMNS = os.environ.get("AZURE_SEARCH_VECTOR_COLUMNS")
    AZURE_SEARCH_ENABLE_IN_DOMAIN = os.environ.get("AZURE_SEARCH_ENABLE_IN_DOMAIN", SEARCH_ENABLE_IN_DOMAIN)
    AZURE_SEARCH_TOP_K = os.environ.get("AZURE_SEARCH_TOP_K", SEARCH_TOP_K)
    AZURE_SEARCH_STRICTNESS = os.environ.get("AZURE_SEARCH_STRICTNESS", SEARCH_STRICTNESS)

    # Azure CosmosDB
    AZURE_COSMOSDB_ENDPOINT = f'https://{os.environ.get("MSR_AZURE_COSMOSDB_ACCOUNT")}.documents.azure.com:443/'
    AZURE_COSMOSDB_DATABASE_NAME = os.environ.get("MSR_AZURE_COSMOSDB_DATABASE")
    AZURE_COSMOSDB_CONTAINER_NAME = os.environ.get("MSR_AZURE_COSMOSDB_CONVERSATIONS_CONTAINER")
    AZURE_COSMOSDB_ACCOUNT_KEY = os.environ.get("MSR_AZURE_COSMOSDB_ACCOUNT_KEY")

    # CosmosDB Mongo vcore vector db Settings
    AZURE_COSMOSDB_MONGO_VCORE_CONNECTION_STRING = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_CONNECTION_STRING")  #This has to be secure string
    AZURE_COSMOSDB_MONGO_VCORE_DATABASE = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_DATABASE")
    AZURE_COSMOSDB_MONGO_VCORE_CONTAINER = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_CONTAINER")
    AZURE_COSMOSDB_MONGO_VCORE_INDEX = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_INDEX")
    AZURE_COSMOSDB_MONGO_VCORE_TOP_K = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_TOP_K", AZURE_SEARCH_TOP_K)
    AZURE_COSMOSDB_MONGO_VCORE_STRICTNESS = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_STRICTNESS", AZURE_SEARCH_STRICTNESS)  
    AZURE_COSMOSDB_MONGO_VCORE_ENABLE_IN_DOMAIN = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_ENABLE_IN_DOMAIN", AZURE_SEARCH_ENABLE_IN_DOMAIN)
    AZURE_COSMOSDB_MONGO_VCORE_CONTENT_COLUMNS = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_CONTENT_COLUMNS", "")
    AZURE_COSMOSDB_MONGO_VCORE_FILENAME_COLUMN = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_FILENAME_COLUMN")
    AZURE_COSMOSDB_MONGO_VCORE_TITLE_COLUMN = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_TITLE_COLUMN")
    AZURE_COSMOSDB_MONGO_VCORE_URL_COLUMN = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_URL_COLUMN")
    AZURE_COSMOSDB_MONGO_VCORE_VECTOR_COLUMNS = os.environ.get("AZURE_COSMOSDB_MONGO_VCORE_VECTOR_COLUMNS")

    # Elasticsearch Integration Settings
    ELASTICSEARCH_ENDPOINT = os.environ.get("ELASTICSEARCH_ENDPOINT")
    ELASTICSEARCH_ENCODED_API_KEY = os.environ.get("ELASTICSEARCH_ENCODED_API_KEY")
    ELASTICSEARCH_INDEX = os.environ.get("ELASTICSEARCH_INDEX")
    ELASTICSEARCH_QUERY_TYPE = os.environ.get("ELASTICSEARCH_QUERY_TYPE", "simple")
    ELASTICSEARCH_TOP_K = os.environ.get("ELASTICSEARCH_TOP_K", SEARCH_TOP_K)
    ELASTICSEARCH_ENABLE_IN_DOMAIN = os.environ.get("ELASTICSEARCH_ENABLE_IN_DOMAIN", SEARCH_ENABLE_IN_DOMAIN)
    ELASTICSEARCH_CONTENT_COLUMNS = os.environ.get("ELASTICSEARCH_CONTENT_COLUMNS")
    ELASTICSEARCH_FILENAME_COLUMN = os.environ.get("ELASTICSEARCH_FILENAME_COLUMN")
    ELASTICSEARCH_TITLE_COLUMN = os.environ.get("ELASTICSEARCH_TITLE_COLUMN")
    ELASTICSEARCH_URL_COLUMN = os.environ.get("ELASTICSEARCH_URL_COLUMN")
    ELASTICSEARCH_VECTOR_COLUMNS = os.environ.get("ELASTICSEARCH_VECTOR_COLUMNS")
    ELASTICSEARCH_STRICTNESS = os.environ.get("ELASTICSEARCH_STRICTNESS", SEARCH_STRICTNESS)
    ELASTICSEARCH_EMBEDDING_MODEL_ID = os.environ.get("ELASTICSEARCH_EMBEDDING_MODEL_ID")

    SHOULD_STREAM = True if AZURE_OPENAI_STREAM.lower() == "true" else False

    message_uuid = ""

    conversation_client = ConversationTelemetryClient(cosmosdb_endpoint=str(AZURE_COSMOSDB_ENDPOINT), 
                                                          credential=str(AZURE_COSMOSDB_ACCOUNT_KEY), 
                                                          database_name=str(AZURE_COSMOSDB_DATABASE_NAME), 
                                                          container_name=str(AZURE_COSMOSDB_CONTAINER_NAME)
    )

    # methods to implement in orchestrator
    def fetchUserGroups(self, userToken, nextLink=None):
        # Recursively fetch group membership
        if nextLink:
            endpoint = nextLink
        else:
            endpoint = "https://graph.microsoft.com/v1.0/me/transitiveMemberOf?$select=id"
        
        headers = {
            'Authorization': "bearer " + userToken
        }
        try :
            r = requests.get(endpoint, headers=headers)
            if r.status_code != 200:
                if self.DEBUG_LOGGING:
                    logging.error(f"Error fetching user groups: {r.status_code} {r.text}")
                return []
            
            r = r.json()
            if "@odata.nextLink" in r:
                nextLinkData = self.fetchUserGroups(userToken, r["@odata.nextLink"])
                r['value'].extend(nextLinkData)
            
            return r['value']
        except Exception as e:
            logging.error(f"Exception in fetchUserGroups: {e}")
            return []

    # Filter for permitted user groups    
    def generateFilterString(self, userToken):
        # Get list of groups user is a member of
        userGroups = self.fetchUserGroups(self, userToken)

        # Construct filter string
        if not userGroups:
            logging.debug("No user groups found")

        group_ids = ", ".join([obj['id'] for obj in userGroups])
        return f"{self.AZURE_SEARCH_PERMITTED_GROUPS_COLUMN}/any(g:search.in(g, '{group_ids}'))"

    # Format response as newline delimited json
    def format_as_ndjson(self, obj: dict) -> str:
        return json.dumps(obj, ensure_ascii=False) + "\n"

    def parse_multi_columns(self, columns: str) -> list:
        if "|" in columns:
            return columns.split("|")
        else:
            return columns.split(",")

    # Format request body and headers with relevant info based on search type
    def prepare_body_headers_with_data(self, request):
        request_messages = request.json["messages"]

        body = {
            "messages": request_messages,
            "temperature": float(self.AZURE_OPENAI_TEMPERATURE),
            "max_tokens": int(self.AZURE_OPENAI_MAX_TOKENS),
            "top_p": float(self.AZURE_OPENAI_TOP_P),
            "stop": self.AZURE_OPENAI_STOP_SEQUENCE.split("|") if self.AZURE_OPENAI_STOP_SEQUENCE else None,
            "stream": self.SHOULD_STREAM,
            "dataSources": []
        }

        if self.DATASOURCE_TYPE == "AzureCognitiveSearch":
            # Set query type
            query_type = "simple"
            if self.AZURE_SEARCH_QUERY_TYPE:
                query_type = self.AZURE_SEARCH_QUERY_TYPE
            elif self.AZURE_SEARCH_USE_SEMANTIC_SEARCH.lower() == "true" and self.AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG:
                query_type = "semantic"

            # Set filter
            filter = None
            userToken = None
            if self.AZURE_SEARCH_PERMITTED_GROUPS_COLUMN:
                userToken = request.headers.get('X-MS-TOKEN-AAD-ACCESS-TOKEN', "")
                if self.DEBUG_LOGGING:
                    logging.debug(f"USER TOKEN is {'present' if userToken else 'not present'}")

                filter = self.generateFilterString(userToken)
                if self.DEBUG_LOGGING:
                    logging.debug(f"FILTER: {filter}")

            body["dataSources"].append(
                {
                    "type": "AzureCognitiveSearch",
                    "parameters": {
                        "endpoint": f"https://{self.AZURE_SEARCH_SERVICE}.search.windows.net",
                        "key": self.AZURE_SEARCH_KEY,
                        "indexName": self.AZURE_SEARCH_INDEX,
                        "fieldsMapping": {
                            "contentFields": self.parse_multi_columns(self.AZURE_SEARCH_CONTENT_COLUMNS) if self.AZURE_SEARCH_CONTENT_COLUMNS else [],
                            "titleField": self.AZURE_SEARCH_TITLE_COLUMN if self.AZURE_SEARCH_TITLE_COLUMN else None,
                            "urlField": self.AZURE_SEARCH_URL_COLUMN if self.AZURE_SEARCH_URL_COLUMN else None,
                            "filepathField": self.AZURE_SEARCH_FILENAME_COLUMN if self.AZURE_SEARCH_FILENAME_COLUMN else None,
                            "vectorFields": self.parse_multi_columns(self.AZURE_SEARCH_VECTOR_COLUMNS) if self.AZURE_SEARCH_VECTOR_COLUMNS else []
                        },
                        "inScope": True if self.AZURE_SEARCH_ENABLE_IN_DOMAIN.lower() == "true" else False,
                        "topNDocuments": int(self.AZURE_SEARCH_TOP_K),
                        "queryType": query_type,
                        "semanticConfiguration": self.AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG if self.AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG else "",
                        "roleInformation": self.AZURE_OPENAI_SYSTEM_MESSAGE,
                        "filter": filter,
                        "strictness": int(self.AZURE_SEARCH_STRICTNESS)
                    }
                })
        elif self.DATASOURCE_TYPE == "AzureCosmosDB":
            # Set query type
            query_type = "vector"

            body["dataSources"].append(
                {
                    "type": "AzureCosmosDB",
                    "parameters": {
                        "connectionString": self.AZURE_COSMOSDB_MONGO_VCORE_CONNECTION_STRING,
                        "indexName": self.AZURE_COSMOSDB_MONGO_VCORE_INDEX,
                        "databaseName": self.AZURE_COSMOSDB_MONGO_VCORE_DATABASE,
                        "containerName": self.AZURE_COSMOSDB_MONGO_VCORE_CONTAINER,                    
                        "fieldsMapping": {
                            "contentFields": self.parse_multi_columns(self.AZURE_COSMOSDB_MONGO_VCORE_CONTENT_COLUMNS) if self.AZURE_COSMOSDB_MONGO_VCORE_CONTENT_COLUMNS else [],
                            "titleField": self.AZURE_COSMOSDB_MONGO_VCORE_TITLE_COLUMN if self.AZURE_COSMOSDB_MONGO_VCORE_TITLE_COLUMN else None,
                            "urlField": self.AZURE_COSMOSDB_MONGO_VCORE_URL_COLUMN if self.AZURE_COSMOSDB_MONGO_VCORE_URL_COLUMN else None,
                            "filepathField": self.AZURE_COSMOSDB_MONGO_VCORE_FILENAME_COLUMN if self.AZURE_COSMOSDB_MONGO_VCORE_FILENAME_COLUMN else None,
                            "vectorFields": self.parse_multi_columns(self.AZURE_COSMOSDB_MONGO_VCORE_VECTOR_COLUMNS) if self.AZURE_COSMOSDB_MONGO_VCORE_VECTOR_COLUMNS else []
                        },
                        "inScope": True if self.AZURE_COSMOSDB_MONGO_VCORE_ENABLE_IN_DOMAIN.lower() == "true" else False,
                        "topNDocuments": int(self.AZURE_COSMOSDB_MONGO_VCORE_TOP_K),
                        "strictness": int(self.AZURE_COSMOSDB_MONGO_VCORE_STRICTNESS),
                        "queryType": query_type,
                        "roleInformation": self.AZURE_OPENAI_SYSTEM_MESSAGE
                    }
                }
            )

        elif self.DATASOURCE_TYPE == "Elasticsearch":
            body["dataSources"].append(
                {
                    "messages": request_messages,
                    "temperature": float(self.AZURE_OPENAI_TEMPERATURE),
                    "max_tokens": int(self.AZURE_OPENAI_MAX_TOKENS),
                    "top_p": float(self.AZURE_OPENAI_TOP_P),
                    "stop": self.AZURE_OPENAI_STOP_SEQUENCE.split("|") if self.AZURE_OPENAI_STOP_SEQUENCE else None,
                    "stream": self.SHOULD_STREAM,
                    "dataSources": [
                        {
                            "type": "AzureCognitiveSearch",
                            "parameters": {
                                "endpoint": self.ELASTICSEARCH_ENDPOINT,
                                "encodedApiKey": self.ELASTICSEARCH_ENCODED_API_KEY,
                                "indexName": self.ELASTICSEARCH_INDEX,
                                "fieldsMapping": {
                                    "contentFields": self.parse_multi_columns(self.ELASTICSEARCH_CONTENT_COLUMNS) if self.ELASTICSEARCH_CONTENT_COLUMNS else [],
                                    "titleField": self.ELASTICSEARCH_TITLE_COLUMN if self.ELASTICSEARCH_TITLE_COLUMN else None,
                                    "urlField": self.ELASTICSEARCH_URL_COLUMN if self.ELASTICSEARCH_URL_COLUMN else None,
                                    "filepathField": self.ELASTICSEARCH_FILENAME_COLUMN if self.ELASTICSEARCH_FILENAME_COLUMN else None,
                                    "vectorFields": self.parse_multi_columns(self.ELASTICSEARCH_VECTOR_COLUMNS) if self.ELASTICSEARCH_VECTOR_COLUMNS else []
                                },
                                "inScope": True if self.ELASTICSEARCH_ENABLE_IN_DOMAIN.lower() == "true" else False,
                                "topNDocuments": int(self.ELASTICSEARCH_TOP_K),
                                "queryType": self.ELASTICSEARCH_QUERY_TYPE,
                                "roleInformation": self.AZURE_OPENAI_SYSTEM_MESSAGE,
                                "embeddingEndpoint": self.AZURE_OPENAI_EMBEDDING_ENDPOINT,
                                "embeddingKey": self.AZURE_OPENAI_EMBEDDING_KEY,
                                "embeddingModelId": self.ELASTICSEARCH_EMBEDDING_MODEL_ID,
                                "strictness": int(self.ELASTICSEARCH_STRICTNESS)
                            }
                        }
                    ]
                }
            )
        else:
            raise Exception(f"DATASOURCE_TYPE is not configured or unknown: {self.DATASOURCE_TYPE}")

        if "vector" in query_type.lower():
            if self.AZURE_OPENAI_EMBEDDING_NAME:
                body["dataSources"][0]["parameters"]["embeddingDeploymentName"] = self.AZURE_OPENAI_EMBEDDING_NAME
            else:
                body["dataSources"][0]["parameters"]["embeddingEndpoint"] = self.AZURE_OPENAI_EMBEDDING_ENDPOINT
                body["dataSources"][0]["parameters"]["embeddingKey"] = self.AZURE_OPENAI_EMBEDDING_KEY

        if self.DEBUG_LOGGING:
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
            'api-key': self.AZURE_OPENAI_KEY,
            "x-ms-useragent": "GitHubSampleWebApp/PublicAPI/3.0.0"
        }

        return body, headers

    # Format chat response with no streaming output
    def formatApiResponseNoStreaming(self, rawResponse):
        if 'error' in rawResponse:
            return {"error": rawResponse["error"]}
        response = {
            "id": rawResponse["id"],
            "model": rawResponse["model"],
            "created": rawResponse["created"],
            "object": rawResponse["object"],
            "choices": [{
                "messages": []
            }],
        }
        toolMessage = {
            "role": "tool",
            "content": rawResponse["choices"][0]["message"]["context"]["messages"][0]["content"]
        }
        assistantMessage = {
            "role": "assistant",
            "content": rawResponse["choices"][0]["message"]["content"]
        }
        response["choices"][0]["messages"].append(toolMessage)
        response["choices"][0]["messages"].append(assistantMessage)

        return response
    
    # Format chat response with streaming output
    def formatApiResponseStreaming(self, rawResponse):
        if 'error' in rawResponse:
            return {"error": rawResponse["error"]}
        response = {
            "id": rawResponse["id"],
            "model": rawResponse["model"],
            "created": rawResponse["created"],
            "object": rawResponse["object"],
            "choices": [{
                "messages": []
            }],
        }

        if rawResponse["choices"][0]["delta"].get("context"):
            messageObj = {
                "delta": {
                    "role": "tool",
                    "content": rawResponse["choices"][0]["delta"]["context"]["messages"][0]["content"]
                }
            }
            response["choices"][0]["messages"].append(messageObj)
        elif rawResponse["choices"][0]["delta"].get("role"):
            messageObj = {
                "delta": {
                    "role": "assistant",
                }
            }
            response["choices"][0]["messages"].append(messageObj)
        else:
            if rawResponse["choices"][0]["end_turn"]:
                messageObj = {
                    "delta": {
                        "content": "[DONE]",
                    }
                }
                response["choices"][0]["messages"].append(messageObj)
            else:
                messageObj = {
                    "delta": {
                        "content": rawResponse["choices"][0]["delta"]["content"],
                    }
                }
                response["choices"][0]["messages"].append(messageObj)

        return response
        
    # Stream chat response with appropriate role referencing data source 
    def stream_with_data(self, body, headers, endpoint, message_uuid, history_metadata={}):
        s = requests.Session()
        try:
            with s.post(endpoint, json=body, headers=headers, stream=True) as r:
                for line in r.iter_lines(chunk_size=10):
                    response = {
                        "id": message_uuid,
                        "model": "",
                        "created": 0,
                        "object": "",
                        "choices": [{
                            "messages": []
                        }],
                        "apim-request-id": "",
                        'history_metadata': history_metadata
                    }
                    if line:
                        if self.AZURE_OPENAI_PREVIEW_API_VERSION == '2023-06-01-preview':
                            lineJson = json.loads(line.lstrip(b'data:').decode('utf-8'))
                        else:
                            try:
                                rawResponse = json.loads(line.lstrip(b'data:').decode('utf-8'))
                                lineJson = self.formatApiResponseStreaming(rawResponse)
                            except json.decoder.JSONDecodeError:
                                continue

                        if 'error' in lineJson:
                            yield self.format_as_ndjson(lineJson)
                        response["id"] = message_uuid
                        response["model"] = lineJson["model"]
                        response["created"] = lineJson["created"]
                        response["object"] = lineJson["object"]
                        response["apim-request-id"] = r.headers.get('apim-request-id')

                        role = lineJson["choices"][0]["messages"][0]["delta"].get("role")

                        if role == "tool":
                            response["choices"][0]["messages"].append(lineJson["choices"][0]["messages"][0]["delta"])
                            self.conversation_client.update_conversation_item(response, history_metadata["conversation_id"])
                            yield self.format_as_ndjson(response)
                        elif role == "assistant": 
                            if response['apim-request-id'] and self.DEBUG_LOGGING: 
                                logging.debug(f"RESPONSE apim-request-id: {response['apim-request-id']}")
                            response["choices"][0]["messages"].append({
                                "role": "assistant",
                                "content": ""
                            })
                            self.conversation_client.update_conversation_item(response, history_metadata["conversation_id"])
                            yield self.format_as_ndjson(response)
                        else:
                            deltaText = lineJson["choices"][0]["messages"][0]["delta"]["content"]
                            if deltaText != "[DONE]":
                                response["choices"][0]["messages"].append({
                                    "role": "assistant",
                                    "content": deltaText
                                })
                                self.conversation_client.update_conversation_item(response, history_metadata["conversation_id"])
                                yield self.format_as_ndjson(response)
        except Exception as e:
            self.conversation_client.update_conversation_item(response, history_metadata["conversation_id"], e)
            yield self.format_as_ndjson({"error" + str(e)})

    # Post chat info if data not configured
    def stream_without_data(self, response, message_uuid, history_metadata={}):
        responseText = ""
        for line in response:
            if line["choices"]:
                deltaText = line["choices"][0]["delta"].get('content')
            else:
                deltaText = ""
            if deltaText and deltaText != "[DONE]":
                responseText = deltaText

            response_obj = {
                "id": message_uuid,
                "model": line["model"],
                "created": line["created"],
                "object": line["object"],
                "choices": [{
                    "messages": [{
                        "role": "assistant",
                        "content": responseText
                    }]
                }],
                "history_metadata": history_metadata
            }
            yield self.format_as_ndjson(response_obj)