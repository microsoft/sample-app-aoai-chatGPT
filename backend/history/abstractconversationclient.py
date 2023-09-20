from abc import ABC, abstractmethod
from typing import Optional, List, Dict

class AbstractConversationClient(ABC):

    @abstractmethod
    def ensure(self) -> bool:
        pass

    @abstractmethod
    def create_conversation(self, user_id: str, title: Optional[str] = '') -> dict:
        pass

    @abstractmethod
    def upsert_conversation(self, conversation: Dict) -> dict:
        pass

    @abstractmethod
    def delete_conversation(self, user_id: str, conversation_id: str):
        pass

    @abstractmethod
    def delete_messages(self, conversation_id: str, user_id: str) -> List:
        pass

    @abstractmethod
    def get_conversations(self, user_id: str) -> List[Dict]:
        pass

    @abstractmethod
    def get_conversation(self, user_id: str, conversation_id: str) -> Optional[Dict]:
        pass

    @abstractmethod
    def create_message(self, conversation_id: str, user_id: str, input_message: Dict) -> dict:
        pass

    @abstractmethod
    def get_messages(self, user_id: str, conversation_id: str) -> List[Dict]:
        pass
