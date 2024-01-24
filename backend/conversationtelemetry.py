import uuid, traceback, logging, os, json
from datetime import datetime
from azure.cosmos import CosmosClient

class ConversationTelemetryClient():
    """
    A class that handles telemetry for conversations.

    This class provides methods to create and update conversation items in a Cosmos DB container.
    It allows tracking and storing conversation details such as user input, model used, and response generated.

    Attributes:
        cosmosdb_endpoint (str): The endpoint URL of the Cosmos DB.
        credential (any): The credential used to authenticate with the Cosmos DB.
        database_name (str): The name of the database in the Cosmos DB.
        container_name (str): The name of the container in the database.
        cosmosdb_client (CosmosClient): The client object for interacting with the Cosmos DB.
        database_client (DatabaseClient): The client object for interacting with the database.
        container_client (ContainerClient): The client object for interacting with the container.
    """

    def __init__(self, cosmosdb_endpoint: str, credential: any, database_name: str, container_name: str):
        self.enabled = os.environ.get("ENABLE_CONVERSATION_TELEMETRY", "false").lower() == "true"
        if self.enabled:
            self.cosmosdb_endpoint = cosmosdb_endpoint
            self.credential = credential
            self.database_name = database_name
            self.container_name = container_name
            self.cosmosdb_client = CosmosClient(self.cosmosdb_endpoint, credential=credential)
            self.database_client = self.cosmosdb_client.get_database_client(database_name)
            self.container_client = self.database_client.get_container_client(container_name)

    def create_conversation_item(self, request_body, aoai_service, model, temperature, history_metadata):
        if not self.enabled or len(request_body["messages"]) == 0 or request_body["messages"][-1]['role'] != "user":
            return history_metadata

        # Create conversation id
        conversation_id = str(uuid.uuid4())
        history_metadata["conversation_id"] = conversation_id

        conversation_item = {
            'aoai_service': aoai_service,
            'model': model,
            'temperature': temperature,
            'timestamp': datetime.now().isoformat(),
            'user_input': request_body["messages"][-1],
            'user_id': str(uuid.uuid4()),
            'conversation_id': request_body["messages"][0]["id"],
            'id': conversation_id
        }

        self.upsert_conversation_item(conversation_item)

        return history_metadata
    
    def log_non_stream(self, r):
        conversation_item = self.get_conversation_item(r['history_metadata']['conversation_id'])
        if conversation_item:
            conversation_item["answer"] = r
            self.upsert_conversation_item(conversation_item)
        else:
            return
    
    def log_stream(self, func):
        def construct_conversation_item(*args, **kwargs):
            generator = func(*args, **kwargs)
            # Skip logging if telemetry is not enabled
            if not self.enabled:
                yield from (result for result in generator)
            else:
                # Proccess results from generator
                for index, result in enumerate(generator):
                    yield result
                    try:
                        result = json.loads(result)
                        if index == 0:
                            conversation_item = self.get_conversation_item(result['history_metadata']['conversation_id'])
                        if conversation_item:
                            self.update_conversation_item(conversation_item, result)
                    except Exception as e:
                        conversation_item["error"] = str(e)
                        conversation_item["error_timestamp"] = datetime.now().isoformat()
                        conversation_item["error_traceback"] = traceback.format_exc()
                        logging.error(traceback.format_exc())
                self.upsert_conversation_item(conversation_item)
        return construct_conversation_item
    
    def update_conversation_item(self, conversation_item, result):
        if conversation_item:
            role = result["choices"][0]["messages"][0]["role"]
            conversation_item["response_timestamp"] = datetime.now().isoformat()
            if role == "tool":
                conversation_item["tool"] = result["choices"][0]["messages"][0]["content"]
            elif role == "assistant":
                if "answer" in conversation_item:
                    conversation_item["answer"]["choices"][0]["messages"][0]["content"] += result["choices"][0]["messages"][0]["content"]
                else:
                    conversation_item["answer"] = result
        return conversation_item

    def get_conversation_item(self, conversation_id):
        query = f"SELECT * FROM c WHERE c.id = '{conversation_id}'"
        items = list(self.container_client.query_items(query, enable_cross_partition_query=True))
        conversation_item = items[0] if len(items) else None
        return conversation_item
            
    def upsert_conversation_item(self, conversation_item):
        try:
            self.container_client.upsert_item(conversation_item)
        except Exception as e:
            error_message = f"Error: {e} - {traceback.format_exc()}"
            logging.error(error_message)
