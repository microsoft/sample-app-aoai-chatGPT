import json
import uuid
from datetime import datetime
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient

from backend.history.abstractconversationclient import AbstractConversationClient


class BlobConversationClient(AbstractConversationClient):
    def __init__(
        self,
        blob_endpoint: str,
        container_name: str,
        credential: DefaultAzureCredential | str,
    ):
        self.blob_service_client = BlobServiceClient(
            account_url=blob_endpoint, credential=credential
        )
        self.container_client = self.blob_service_client.get_container_client(
            container_name
        )
        if not self.container_client.exists():
            self.container_client.create_container()

    def ensure(self):
        try:
            if not self.blob_service_client or not self.container_client:
                return False

            container_info = self.container_client.get_container_properties()
            if not container_info:
                return False

            return True
        except:
            return False

    def create_conversation(self, user_id: str, title: str = ""):
        conversation_id = str(uuid.uuid4())
        blob_name = f"conversation/{user_id}/{conversation_id}.json"
        conversation = {
            "id": conversation_id,
            "type": "conversation",
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
            "userId": user_id,
            "title": title,
        }
        self._upload_json(blob_name, conversation)

        return conversation

    def upsert_conversation(self, conversation: dict):
        blob_name = f"conversation/{conversation['userId']}/{conversation['id']}.json"
        self._upload_json(blob_name, conversation)
        return conversation

    def delete_conversation(self, user_id: str, conversation_id: str):
        blob_name = f"conversation/{user_id}/{conversation_id}.json"
        return self.container_client.delete_blob(blob_name)

    def delete_messages(self, conversation_id: str, user_id: str):
        blob_prefix = f"message/{user_id}/{conversation_id}/"
        blobs = self.container_client.list_blobs(name_starts_with=blob_prefix)
        response_list = []
        for blob in blobs:
            resp = self.container_client.delete_blob(blob.name)
            response_list.append(resp)

        return response_list

    def get_conversations(self, user_id: str):
        blob_prefix = f"conversation/{user_id}/"
        blobs = self.container_client.list_blobs(name_starts_with=blob_prefix)
        conversations = [self._download_json(blob.name) for blob in blobs]
        return sorted(conversations, key=lambda x: x.get('updatedAt', ''))

    def get_conversation(self, user_id: str, conversation_id: str):
        blob_name = f"conversation/{user_id}/{conversation_id}.json"
        return self._download_json(blob_name)

    def create_message(self, conversation_id: str, user_id: str, input_message: dict):
        message_id = str(uuid.uuid4())
        blob_name = f"message/{user_id}/{conversation_id}/{message_id}.json"
        message = {
            "id": message_id,
            "type": "message",
            "userId": user_id,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
            "conversationId": conversation_id,
            "role": input_message["role"],
            "content": input_message["content"],
        }

        resp = self._upload_json(blob_name, message)

        if resp:
            conversation = self.get_conversation(user_id, conversation_id)
            conversation["updatedAt"] = message["createdAt"]
            self.upsert_conversation(conversation)
            return resp
        else:
            return False

    def get_messages(self, user_id: str, conversation_id: str):
        blob_prefix = f"message/{user_id}/{conversation_id}/"
        blobs = self.container_client.list_blobs(name_starts_with=blob_prefix)
        messages = [self._download_json(blob.name) for blob in blobs]
        return sorted(messages, key=lambda x: x.get('createdAt', ''))

    def _upload_json(self, blob_name: str, data: dict):
        blob_client = self.container_client.get_blob_client(blob_name)
        return blob_client.upload_blob(json.dumps(data), overwrite=True)

    def _download_json(self, blob_name: str) -> dict:
        blob_client = self.container_client.get_blob_client(blob_name)
        if blob_client.exists():
            return json.loads(blob_client.download_blob().readall().decode())
        return None
