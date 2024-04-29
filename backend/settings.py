import os
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

# Debug settings
# DEBUG = os.environ.get("DEBUG", "false")
# if DEBUG.lower() == "true":
#     logging.basicConfig(level=logging.DEBUG)


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
    

class _PromptflowSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="PROMPTFLOW_",
        env_file=".env",
        extra="ignore"
    )

    endpoint: str
    api_key: str
    response_timeout: float = 30.0
    request_field_name: str = "query"
    response_field_name: str = "reply"
    citations_field_name: str = "documents"


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
    stream: bool = True
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
    
    def extract_embedding_dependency(self) -> Optional[dict]:
        if self.embedding_name:
            return {
                "type": "deployment_name",
                "deployment_name": self.embedding_name
            }
        
        elif self.embedding_endpoint and self.embedding_key:
            return {
                "type": "endpoint",
                "endpoint": self.embedding_endpoint,
                "authentication": {
                    "type": "api_key",
                    "api_key": self.embedding_key
                }
            }
        else:   
            return None
    

class _SearchCommonSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SEARCH_",
        env_file=".env",
        extra="ignore"
    )
    
    datasource_type: str = Field(
        validation_alias="DATASOURCE_TYPE",
        exclude=True
    )
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
        settings: '_AppSettings',
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
    service: str = Field(serialization_alias="endpoint")
    index: str = Field(serialization_alias="index_name")
    key: Optional[str] = Field(default=None, exclude=True)
    use_semantic_search: bool = Field(default=False, exclude=True)
    semantic_search_config: str = ""
    content_columns: Optional[List[str]] = Field(default=None, exclude=True)
    vector_columns: Optional[List[str]] = Field(default=None, exclude=True)
    title_column: Optional[str] = Field(default=None, exclude=True)
    url_column: Optional[str] = Field(default=None, exclude=True)
    filename_column: Optional[str] = Field(default=None, exclude=True)
    query_type: Literal[
        'simple',
        'vector',
        'semantic',
        'vector_simple_hybrid',
        'vector_semantic_hybrid'
    ] = "simple"
    permitted_groups_column: Optional[str] = Field(default=None, exclude=True)
    
    # Constructed fields
    authentication: Optional[dict] = None
    embedding_dependency: Optional[dict] = None
    fields_mapping: Optional[dict] = None
    filter: Optional[str] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def set_authentication(self) -> Self:
        if self.key:
            self.authentication = {"type": "api_key", "api_key": self.key}
        else:
            self.authentication = {"type": "system_assigned_managed_identity"}
            
        return self
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_fields,
            "title_field": self.title_field,
            "url_field": self.url_field,
            "filepath_field": self.filepath_field,
            "vector_fields": self.vector_fields
        }
        return self

    def _set_filter_string(self, request: Request) -> str:
        if self.permitted_groups_column:
            user_token = request.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN", "")
            logging.debug(f"USER TOKEN is {'present' if user_token else 'not present'}")
            if not user_token:
                raise ValueError(
                    "Document-level access control is enabled, but user access token could not be fetched."
                )

            filter_string = generateFilterString(user_token)
            logging.debug(f"FILTER: {filter_string}")
            return filter_string
        
        return None
            
    def construct_payload_configuration(
        self,
        settings: '_AppSettings',
        request: Request = None,
        **kwargs
    ):
        self.filter = self._set_filter_string(request)
        self.embedding_dependency = \
            settings.azure_openai.extract_embedding_dependency()
        parameters = self.model_dump()
        parameters.update(settings.search.model_dump())
        
        return {
            "type": "azure_search",
            "parameters": parameters
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
    connection_string: str = Field(exclude=True)
    index: str = Field(serialization_alias="index_name")
    database: str = Field(serialization_alias="database_name")
    container: str = Field(serialization_alias="container_name")
    content_columns: Optional[List[str]] = Field(default=None, exclude=True)
    vector_columns: Optional[List[str]] = Field(default=None, exclude=True)
    title_column: Optional[str] = Field(default=None, exclude=True)
    url_column: Optional[str] = Field(default=None, exclude=True)
    filename_column: Optional[str] = Field(default=None, exclude=True)
    
    # Constructed fields
    authentication: Optional[dict] = None
    embedding_dependency: Optional[dict] = None
    fields_mapping: Optional[dict] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def construct_authentication(self) -> Self:
        self.authentication = {
            "type": "connection_string",
            "connection_string": self.connection_string
        }
        return self
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_fields,
            "title_field": self.title_field,
            "url_field": self.url_field,
            "filepath_field": self.filepath_field,
            "vector_fields": self.vector_fields
        }
        return self
    
    def construct_payload_configuration(
        self,
        settings: '_AppSettings',
        **kwargs
    ):
        self.embedding_dependency = \
            settings.azure_openai.extract_embedding_dependency()
        parameters = self.model_dump()
        parameters.update(settings.search.model_dump())
        return {
            "type": "azure_cosmos_db",
            "parameters": parameters
        }


class _ElasticsearchSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="ELASTICSEARCH_",
        env_file=".env",
        extra="ignore"
    )
    endpoint: str
    encoded_api_key: str = Field(exclude=True)
    index: str = Field(serialization_alias="index_name")
    query_type: Literal['simple', 'vector'] = "simple"
    content_columns: Optional[List[str]] = Field(default=None, exclude=True)
    vector_columns: Optional[List[str]] = Field(default=None, exclude=True)
    title_column: Optional[str] = Field(default=None, exclude=True)
    url_column: Optional[str] = Field(default=None, exclude=True)
    filename_column: Optional[str] = Field(default=None, exclude=True)
    embedding_model_id: Optional[str] = Field(default=None, exclude=True)
    
    # Constructed fields
    authentication: Optional[dict] = None
    embedding_dependency: Optional[dict] = None
    fields_mapping: Optional[dict] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def set_authentication(self) -> Self:
        self.authentication = {
            "type": "encoded_api_key",
            "encoded_api_key": self.key
        }
        
        return self
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_fields,
            "title_field": self.title_field,
            "url_field": self.url_field,
            "filepath_field": self.filepath_field,
            "vector_fields": self.vector_fields
        }
        return self
    
    def construct_payload_configuration(
        self,
        settings: '_AppSettings',
        **kwargs
    ):
        self.embedding_dependency = \
            settings.azure_openai.extract_embedding_dependency() or \
            {"type": "model_id", "model_id": self.embedding_model_id}
            
        parameters = self.model_dump()
        parameters.update(settings.search.model_dump())
                
        return {
            "type": "elasticsearch",
            "parameters": parameters
        }


class _PineconeSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="PINECONE_",
        env_file=".env",
        extra="ignore"
    )
    environment: str
    api_key: str = Field(exclude=True)
    index_name: str
    query_type: Literal["vector"] = "vector"
    content_columns: Optional[List[str]] = Field(default=None, exclude=True)
    vector_columns: Optional[List[str]] = Field(default=None, exclude=True)
    title_column: Optional[str] = Field(default=None, exclude=True)
    url_column: Optional[str] = Field(default=None, exclude=True)
    filename_column: Optional[str] = Field(default=None, exclude=True)
    
    # Constructed fields
    authentication: Optional[dict] = None
    embedding_dependency: Optional[dict] = None
    fields_mapping: Optional[dict] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def set_authentication(self) -> Self:
        self.authentication = {
            "type": "api_key",
            "api_key": self.api_key
        }
        
        return self
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_fields,
            "title_field": self.title_field,
            "url_field": self.url_field,
            "filepath_field": self.filepath_field,
            "vector_fields": self.vector_fields
        }
        return self
    
    def construct_payload_configuration(
        self,
        settings: '_AppSettings',
        **kwargs
    ):
        self.embedding_dependency = \
            settings.azure_openai.extract_embedding_dependency()
        parameters = self.model_dump()
        parameters.update(settings.search.model_dump())
        
        return {
            "type": "pinecone",
            "parameters": parameters
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
    content_columns: Optional[List[str]] = Field(default=None, exclude=True)
    vector_columns: Optional[List[str]] = Field(default=None, exclude=True)
    title_column: Optional[str] = Field(default=None, exclude=True)
    url_column: Optional[str] = Field(default=None, exclude=True)
    filename_column: Optional[str] = Field(default=None, exclude=True)
    
    # Constructed fields
    fields_mapping = Optional[dict] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if comma_separated_string:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_fields,
            "title_field": self.title_field,
            "url_field": self.url_field,
            "filepath_field": self.filepath_field,
            "vector_fields": self.vector_fields
        }
        return self
    
    def construct_payload_configuration(
        self,
        settings: '_AppSettings',
        **kwargs
    ):
        parameters = self.model_dump()
        parameters.update(settings.search.model_dump())
        
        return {
            "type": "azure_ml_index",
            "parameters": parameters
        }


class _BaseSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )
    
    datasource_type: str
    auth_enabled: bool = False
    sanitize_answer: bool = False
    use_promptflow: bool = False
    

class _AppSettings(BaseModel):
    base_settings: _BaseSettings = _BaseSettings()
    azure_openai: _AzureOpenAISettings = _AzureOpenAISettings()
    search: _SearchCommonSettings = _SearchCommonSettings()
    ui: Optional[_UiSettings] = _UiSettings()
    
    # Constructed properties
    chat_history: Optional[_ChatHistorySettings] = None
    datasource: Optional[DatasourcePayloadConstructor] = None
    promptflow: Optional[_PromptflowSettings] = None

    @model_validator(mode="after")
    def set_promptflow_settings(self) -> Self:
        try:
            self.promptflow = _PromptflowSettings()
            
        except ValidationError:
            self.promptflow = None
    
    @model_validator(mode="after")
    def set_chat_history_settings(self) -> Self:
        try:
            self.chat_history = _ChatHistorySettings()
        
        except ValidationError:
            self.chat_history = None
        
        return self
    
    @model_validator(mode="after")
    def set_datasource_settings(self) -> Self:
        if self.search.datasource_type == "AzureCognitiveSearch":
            self.datasource = _AzureSearchSettings()
            logging.debug("Using Azure Cognitive Search")
           
        elif self.search.datasource_type == "AzureCosmosDB":
            self.datasource = _AzureCosmosDbMongoVcoreSettings()
            logging.debug("Using Azure CosmosDB Mongo vcore")
           
        elif self.search.datasource_type == "Elasticsearch":
            self.datasource = _ElasticsearchSettings()
            logging.debug("Using Elasticsearch")
           
        elif self.search.datasource_type == "Pinecone":
            self.datasource = _PineconeSettings()
            logging.debug("Using Pinecone")
        
        elif self.search.datasource_type == "AzureMLIndex":
            self.datasource = _AzureMLIndexSettings()
            logging.debug("Using Azure ML Index")
            
        else:
            self.datasource = None
            logging.warn("No datasource configuration found in the environment -- calls will be made to Azure OpenAI without grounding data.")
            
        return self


app_settings = _AppSettings()
