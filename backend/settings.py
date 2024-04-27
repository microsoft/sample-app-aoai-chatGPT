import logging
from abc import ABC, abstractmethod
from pydantic import (
    BaseModel,
    Field,
    model_validator,
    field_validator,
    ValidationError
)
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Literal, Optional
from typing_extensions import Self
from quart import Request
from backend.utils import parse_multi_columns, generateFilterString

MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION = "2024-03-01-preview"


class _ChatHistorySettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_COSMOSDB_",
        env_file=".env",
        extra="ignore"
    )
    
    database: str
    account: str
    account_key: str
    conversations_container: str
    enable_feedback: bool = False
    
  
class _AzureOpenAISettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_OPENAI_",
        env_file=".env",
        extra='ignore'
    )
    
    resource: str
    model: str
    endpoint: str
    key: str
    temperature: float = 0
    top_p: float = 0
    max_tokens: int = 1000
    stop_sequence: Optional[List[str]] = None
    system_message: str = "You are an AI assistant that helps people find information."
    preview_api_version: str = MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION
    embedding_endpoint: Optional[str] = None
    embedding_key: Optional[str] = None
    embedding_name: Optional[str] = None
    
    @field_validator('stop_sequence', mode='before')
    @classmethod
    def split_contexts(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    

class _SearchCommonSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SEARCH_",
        env_file=".env",
        extra="ignore"
    )
    
    datasource_type: str = Field(validation_alias="DATASOURCE_TYPE")
    top_k: int = 5
    strictness: int = 3
    enable_in_domain: bool = True
    max_search_queries: Optional[int] = None
    allow_partial_result: bool = False
    include_contexts: Optional[List[str]] = ["citations", "intent"]
    vectorization_dimensions: Optional[int] = None
    role_information: str = Field(
        validation_alias="AZURE_OPENAI_SYSTEM_MESSAGE"
    )

    @field_validator('include_contexts', mode='before')
    @classmethod
    def split_contexts(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None


class DatasourcePayloadConstructor(ABC):
    @abstractmethod
    def construct_payload_configuration(
        self,
        search_common_settings: _SearchCommonSettings,
        **kwargs
    ):
        pass


class _AzureSearchSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_SEARCH_",
        env_file=".env",
        extra="ignore",
        use_enum_values=True
    )
    service: str
    index: str
    key: Optional[str] = None
    use_semantic_search: bool = False
    semantic_search_config: str = "default"
    content_columns: Optional[List[str]] = None
    vector_columns: Optional[List[str]] = None
    title_column: Optional[str] = None
    url_column: Optional[str] = None
    filename_column: Optional[str] = None
    query_type: Literal[
        'simple',
        'vector',
        'semantic',
        'vector_simple_hybrid',
        'vector_semantic_hybrid'
    ] = "simple"
    permitted_groups_column: Optional[str] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    def construct_authentication(self):
        if self.key:
            return {"type": "api_key", "api_key": self.key}
        else:
            return {"type": "system_assigned_managed_identity"}
    
    def construct_filter_string(self, request: Request) -> str:
        if self.permitted_groups_column:
            user_token = request.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN", "")
            logging.debug(f"USER TOKEN is {'present' if user_token else 'not present'}")
            if not user_token:
                raise ValueError(
                    "Document-level access control is enabled, but user access token could not be fetched."
                )

            filter = generateFilterString(user_token)
            logging.debug(f"FILTER: {filter}")
            return filter
            
    def construct_payload_configuration(
        self,
        search_common_settings: _SearchCommonSettings,
        request: Request = None,
        **kwargs
    ):
        return {
            "type": "azure_search",
            "parameters": {
                "endpoint": f"https://{self.service}.search.windows.net",
                "authentication": self.construct_authentication(),
                "index_name": self.index,
                "fields_mapping": {
                    "content_fields": self.content_columns,
                    "title_field": self.title_column,
                    "url_field": self.url_column,
                    "filepath_field": self.filename_column,
                    "vector_fields": self.vector_columns
                },
                "in_scope": search_common_settings.enable_in_domain,
                "top_n_documents": search_common_settings.top_k,
                "query_type": self.query_type,
                "semantic_configuration": self.semantic_search_config,
                "role_information": search_common_settings.role_information,
                "filter": self.construct_filter_string(request),
                "strictness": search_common_settings.strictness
            }
        }


class _AzureCosmosDbMongoVcoreSettings(
    BaseSettings,
    DatasourcePayloadConstructor
):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_COSMOSDB_MONGO_VCORE_",
        env_file=".env",
        extra="ignore"
    )
    query_type: Literal['vector'] = "vector"
    connection_string: str
    database: str
    container: str
    content_columns: Optional[List[str]] = None
    vector_columns: Optional[List[str]] = None
    title_column: Optional[str] = None
    url_column: Optional[str] = None
    filename_column: Optional[str] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    def construct_authentication(self):
        return {
            "type": "connection_string",
            "connection_string": self.connection_string
        }
            
    def construct_payload_configuration(
        self,
        search_common_settings: _SearchCommonSettings,
        **kwargs
    ):
        return {
            "type": "azure_cosmos_db",
            "parameters": {
                "authentication": self.construct_authentication(),
                "index_name": self.index,
                "database_name": self.database,
                "container_name": self.container,
                "fields_mapping": {
                    "content_fields": self.content_columns,
                    "title_field": self.title_column,
                    "url_field": self.url_column,
                    "filepath_field": self.filename_column,
                    "vector_fields": self.vector_columns
                },
                "in_scope": search_common_settings.enable_in_domain,
                "top_n_documents": search_common_settings.top_k,
                "query_type": self.query_type,
                "role_information": search_common_settings.role_information,
                "strictness": search_common_settings.strictness
            }
        }


class _ElasticsearchSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="ELASTICSEARCH_",
        env_file=".env",
        extra="ignore"
    )
    endpoint: str
    encoded_api_key: str
    index: str
    query_type: Literal['simple', 'vector'] = "simple"
    content_columns: Optional[List[str]] = None
    vector_columns: Optional[List[str]] = None
    title_column: Optional[str] = None
    url_column: Optional[str] = None
    filename_column: Optional[str] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    def construct_authentication(self):
        return {
            "type": "encoded_api_key",
            "encoded_api_key": self.key
        }
            
    def construct_payload_configuration(
        self,
        search_common_settings: _SearchCommonSettings,
        **kwargs
    ):
        return {
            "type": "azure_search",
            "parameters": {
                "endpoint": self.endpoint,
                "authentication": self.construct_authentication(),
                "index_name": self.index,
                "fields_mapping": {
                    "content_fields": self.content_columns,
                    "title_field": self.title_column,
                    "url_field": self.url_column,
                    "filepath_field": self.filename_column,
                    "vector_fields": self.vector_columns
                },
                "in_scope": search_common_settings.enable_in_domain,
                "top_n_documents": search_common_settings.top_k,
                "query_type": self.query_type,
                "role_information": search_common_settings.role_information,
                "strictness": search_common_settings.strictness
            }
        }


class _PineconeSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="PINECONE_",
        env_file=".env",
        extra="ignore"
    )
    environment: str
    api_key: str
    index_name: str
    content_columns: Optional[List[str]] = None
    vector_columns: Optional[List[str]] = None
    title_column: Optional[str] = None
    url_column: Optional[str] = None
    filename_column: Optional[str] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    def construct_authentication(self):
        return {
            "type": "api_key",
            "api_key": self.api_key
        }
            
    def construct_payload_configuration(
        self,
        search_common_settings: _SearchCommonSettings,
        **kwargs
    ):
        return {
            "type": "azure_search",
            "parameters": {
                "environment": self.environment,
                "authentication": self.construct_authentication(),
                "index_name": self.index,
                "fields_mapping": {
                    "content_fields": self.content_columns,
                    "title_field": self.title_column,
                    "url_field": self.url_column,
                    "filepath_field": self.filename_column,
                    "vector_fields": self.vector_columns
                },
                "in_scope": search_common_settings.enable_in_domain,
                "top_n_documents": search_common_settings.top_k,
                "query_type": "vector",
                "role_information": search_common_settings.role_information,
                "strictness": search_common_settings.strictness
            }
        }


class _AzureMLIndexSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_MLINDEX_",
        env_file=".env",
        extra="ignore"
    )
    name: str
    version: str
    project_resource_id: str = Field(validation_alias="AZURE_ML_PROJECT_RESOURCE_ID")
    content_columns: Optional[List[str]] = None
    vector_columns: Optional[List[str]] = None
    title_column: Optional[str] = None
    url_column: Optional[str] = None
    filename_column: Optional[str] = None
    # TODO: figure out auth, query_type, filter
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    
class _UiSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="UI_",
        env_file=".env",
        extra="ignore"
    )

    title: str = "Contoso"
    logo: Optional[str] = None
    chat_logo: Optional[str] = None
    chat_title: str = "Start chatting"
    chat_description: str = "This chatbot is configured to answer your questions"
    favicon: str = "/favicon.ico"
    show_share_button: bool = True


class _AppSettings(BaseModel):
    azure_openai: _AzureOpenAISettings = _AzureOpenAISettings()
    search: _SearchCommonSettings = _SearchCommonSettings()
    ui: Optional[_UiSettings] = _UiSettings()
    chat_history: Optional[_ChatHistorySettings] = None
    should_stream: bool = False
    auth_enabled: bool = False
    sanitize_answer: bool = False
    datasource_settings: Optional[DatasourcePayloadConstructor] = None
    # TODO: add promptflow settings
   
    @model_validator(mode="after")
    def check_should_stream(self) -> Self:
        pass
   
    @model_validator(mode="after")
    def check_auth_enabled(self) -> Self:
        pass
   
    @model_validator(mode="after")
    def check_sanitize_answer(self) -> Self:
        pass
    
    @model_validator(mode="after")
    def get_chat_history_settings(self) -> Self:
        try:
            self.chat_history = _ChatHistorySettings()
        
        except ValidationError:
            pass
        
        return self
    
    @model_validator(mode="after")
    def get_datasource_settings(self) -> Self:
        if self.search.datasource_type == "AzureCognitiveSearch":
            self.datasource_settings = _AzureSearchSettings()
           
        elif self.search.datasource_type == "AzureCosmosDB":
            self.datasource_settings = _AzureCosmosDbMongoVcoreSettings()
           
        elif self.search.datasource_type == "Elasticsearch":
            self.datasource_settings = _ElasticsearchSettings()
           
        elif self.search.datasource_type == "Pinecone":
            self.datasource_settings = _PineconeSettings()
        
        elif self.search.datasource_type == "AzureMLIndex":
            self.datasource_settings = _AzureMLIndexSettings()
            
        else:
            self.datasource_settings = None
            
        return self


app_settings = _AppSettings()
