import uuid, traceback
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
        self.cosmosdb_endpoint = cosmosdb_endpoint
        self.credential = credential
        self.database_name = database_name
        self.container_name = container_name
        self.cosmosdb_client = CosmosClient(self.cosmosdb_endpoint, credential=credential)
        self.database_client = self.cosmosdb_client.get_database_client(database_name)
        self.container_client = self.database_client.get_container_client(container_name)

    def create_conversation_item(self, request_body, aoai_service, model, temperature):

        id = str(uuid.uuid4())
        if len(request_body["messages"]) > 0 and request_body["messages"][-1]['role'] == "user":
            conversation_item = {
                'aoai_service': aoai_service,
                'model': model,
                'temperature': temperature,
                'timestamp': datetime.now().isoformat(),
                'user_input': request_body["messages"][-1],
                'user_id': str(uuid.uuid4()),
                'conversation_id': request_body["messages"][0]["id"],
                'id': id
            }
            self.container_client.upsert_item(conversation_item)
        return id

    def update_conversation_item(self, result, conversation_item_id, error: Exception = None):

        query = f"SELECT * FROM c WHERE c.id = '{conversation_item_id}'"
        items = list(self.container_client.query_items(query, enable_cross_partition_query=True))
        conversation_item = items[0] if len(items) else None
        role = result["choices"][0]["messages"][0]["role"]
        if conversation_item is None:
            return
        else:
            conversation_item["response_timestamp"] = datetime.now().isoformat()
            if error is not None:
                conversation_item["error"] = str(error)
                conversation_item["traceback"] = traceback.format_exc()
            else:
                if role == "tool":
                    conversation_item["tool"] = result["choices"][0]["messages"][0]["content"]
                elif role == "assistant":
                    if "answer" in conversation_item:
                        conversation_item["answer"]["choices"][0]["messages"][0]["content"] += result["choices"][0]["messages"][0]["content"]
                    else:
                        conversation_item["answer"] = result
            self.container_client.upsert_item(conversation_item)