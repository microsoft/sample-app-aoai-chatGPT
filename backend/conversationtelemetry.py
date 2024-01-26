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
        """
        Creates a conversation item and updates the conversation history metadata.

        Args:
            request_body (dict): The request body containing the conversation messages.
            aoai_service (str): The AOAI service used for generating the response.
            model (str): The model used for generating the response.
            temperature (float): The temperature value used for generating the response.
            history_metadata (dict): The conversation history metadata.

        Returns:
            dict: The updated conversation history metadata.
        """
        messages = request_body.get("messages", [])
        if not self.enabled or len(messages) == 0 or messages[-1].get("role", "") != "user":
            return history_metadata

        # Create conversation id
        id = str(uuid.uuid4())
        history_metadata["conversation_id"] = id
        conversation_id = messages[0].get("id", "")
        user_input = messages[-1]
        
        # Create conversation item
        conversation_item = {
            'aoai_service': aoai_service,
            'model': model,
            'temperature': temperature,
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'user_id': str(uuid.uuid4()),
            'conversation_id': conversation_id,
            'id': id
        }

        self.upsert_conversation_item(conversation_item)

        return history_metadata
    
    def log_non_stream(self, r):
        """
        Logs non-streaming conversation telemetry.

        Args:
            r (dict): The telemetry data to be logged.

        Returns:
            None
        """
        if not self.enabled: return
        conversation_id = r.get("history_metadata", {}).get("conversation_id", "")
        conversation_item = self.get_conversation_item(conversation_id)
        if not conversation_item:
            return

        try:
            conversation_item["answer"] = {
                "id": r.get("id", ""),
                "model": r.get("model", ""),
                "created": r.get("created", ""),
                "object": r.get("object", ""),
                "choices": [{
                    "messages": [
                        r.get("choices", [])[0].get("messages", [])[1]
                    ]
                }],
                "apim-request-id": r.get("apim-request-id", ""),
                "history_metadata": r.get("history_metadata", "")
            }
            conversation_item["tool"] = json.loads(r["choices"][0]["messages"][0]["content"])
            conversation_item["response_timestamp"] = datetime.now().isoformat()
        except Exception as e:
            conversation_item["error"] = str(e)
            conversation_item["error_timestamp"] = datetime.now().isoformat()
            conversation_item["error_traceback"] = traceback.format_exc()
            logging.error(traceback.format_exc())

        self.upsert_conversation_item(conversation_item)
    
    def log_stream(self, func):
        """
        Decorator function that logs the results of a generator function.

        Args:
            func: The generator function to be logged.

        Returns:
            A decorated generator function that logs the results and updates the conversation item.

        """
        def construct_conversation_item(*args, **kwargs):
            generator = func(*args, **kwargs)
            # Skip logging if telemetry is not enabled
            if not self.enabled:
                yield from (result for result in generator)
            else:
                # Process results from generator
                conversation_item = None
                for index, result in enumerate(generator):
                    yield result
                    try:
                        result = json.loads(result)
                        if index == 0:
                            conversation_id = result.get("history_metadata", {}).get("conversation_id", "")
                            conversation_item = self.get_conversation_item(conversation_id)
                        if conversation_item:
                            self.update_conversation_item(conversation_item, result)
                    except Exception as e:
                        conversation_item["error"] = str(e)
                        conversation_item["error_timestamp"] = datetime.now().isoformat()
                        conversation_item["error_traceback"] = traceback.format_exc()
                        logging.error(traceback.format_exc())
                if conversation_item:
                    self.upsert_conversation_item(conversation_item)
        return construct_conversation_item
    
    def update_conversation_item(self, conversation_item, result):
        """
        Updates the given conversation item with the provided result.

        Args:
            conversation_item (dict): The conversation item to be updated.
            result (dict): The result containing the information to update the conversation item.

        Returns:
            dict: The updated conversation item.
        """
        if conversation_item:
            role = result.get("choices", [])[0].get("messages",[])[0].get("role", "")
            conversation_item["response_timestamp"] = datetime.now().isoformat()
            if role == "tool":
                tool = result.get("choices", [])[0].get("messages", [])[0].get("content", "")
                conversation_item["tool"] = json.loads(tool)
            elif role == "assistant":
                if "answer" in conversation_item:
                    message_content = result.get("choices", [])[0].get("messages", [])[0].get("content", "")
                    conversation_item["answer"]["choices"][0]["messages"][0]["content"] += message_content
                else:
                    conversation_item["answer"] = result
        return conversation_item

    def get_conversation_item(self, conversation_id):
        """
        Retrieves a conversation item from the database based on the given conversation ID.

        Args:
            conversation_id (str): The ID of the conversation.

        Returns:
            dict: The conversation item retrieved from the database, or None if no item is found.
        """
        query = f"SELECT * FROM c WHERE c.id = '{conversation_id}'"
        items = list(self.container_client.query_items(query, enable_cross_partition_query=True))
        conversation_item = items[0] if len(items) else None
        return conversation_item
            
    def upsert_conversation_item(self, conversation_item):
        """
        Upserts a conversation item into the container.

        Args:
            conversation_item: The conversation item to be upserted.

        Raises:
            Exception: If an error occurs during the upsert operation.

        Returns:
            None
        """
        try:
            self.container_client.upsert_item(conversation_item)
        except Exception as e:
            error_message = f"Error: {e} - {traceback.format_exc()}"
            logging.error(error_message)
