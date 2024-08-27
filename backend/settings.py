import os
import json
import logging
from abc import ABC, abstractmethod
from pydantic import (
    BaseModel,
    confloat,
    conint,
    conlist,
    Field,
    field_validator,
    model_validator,
    PrivateAttr,
    ValidationError,
    ValidationInfo
)
from pydantic.alias_generators import to_snake
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Literal, Optional
from typing_extensions import Self
from quart import Request
from backend.utils import parse_multi_columns, generateFilterString

DOTENV_PATH = os.environ.get(
    "DOTENV_PATH",
    os.path.join(
        os.path.dirname(
            os.path.dirname(__file__)
        ),
        ".env"
    )
)
MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION = "2024-05-01-preview"


class _UiSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="UI_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )

    title: str = "Contoso"
    logo: Optional[str] = None
    chat_logo: Optional[str] = None
    chat_title: str = "Start chatting"
    chat_description: str = "This chatbot is configured to answer your questions"
    favicon: str = "/favicon.ico"
    show_share_button: bool = True
    show_chat_history_button: bool = True


class _ChatHistorySettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_COSMOSDB_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )

    database: str
    account: str
    account_key: Optional[str] = None
    conversations_container: str
    enable_feedback: bool = False


class _PromptflowSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="PROMPTFLOW_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )

    endpoint: str
    api_key: str
    response_timeout: float = 30.0
    request_field_name: str = "query"
    response_field_name: str = "reply"
    citations_field_name: str = "documents"


class _AzureOpenAIFunction(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    parameters: Optional[dict] = None


class _AzureOpenAITool(BaseModel):
    type: Literal['function'] = 'function'
    function: _AzureOpenAIFunction
    

class _AzureOpenAISettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_OPENAI_",
        env_file=DOTENV_PATH,
        extra='ignore',
        env_ignore_empty=True
    )
    
    model: str
    key: Optional[str] = None
    resource: Optional[str] = None
    endpoint: Optional[str] = None
    temperature: float = 0
    top_p: float = 0
    max_tokens: int = 1000
    stream: bool = True
    stop_sequence: Optional[List[str]] = None
    seed: Optional[int] = None
    choices_count: Optional[conint(ge=1, le=128)] = Field(default=1, serialization_alias="n")
    user: Optional[str] = None
    tools: Optional[conlist(_AzureOpenAITool, min_length=1)] = None
    tool_choice: Optional[str] = None
    logit_bias: Optional[dict] = None
    presence_penalty: Optional[confloat(ge=-2.0, le=2.0)] = 0.0
    frequency_penalty: Optional[confloat(ge=-2.0, le=2.0)] = 0.0
    system_message: str = "You are an AI assistant that helps people find information."
    preview_api_version: str = MINIMUM_SUPPORTED_AZURE_OPENAI_PREVIEW_API_VERSION
    embedding_endpoint: Optional[str] = None
    embedding_key: Optional[str] = None
    embedding_name: Optional[str] = None
    
    @field_validator('tools', mode='before')
    @classmethod
    def deserialize_tools(cls, tools_json_str: str) -> List[_AzureOpenAITool]:
        if isinstance(tools_json_str, str):
            try:
                tools_dict = json.loads(tools_json_str)
                return _AzureOpenAITool(**tools_dict)
            except json.JSONDecodeError:
                logging.warning("No valid tool definition found in the environment.  If you believe this to be in error, please check that the value of AZURE_OPENAI_TOOLS is a valid JSON string.")
            
            except ValidationError as e:
                logging.warning(f"An error occurred while deserializing the tool definition - {str(e)}")
            
        return None
    
    @field_validator('logit_bias', mode='before')
    @classmethod
    def deserialize_logit_bias(cls, logit_bias_json_str: str) -> dict:
        if isinstance(logit_bias_json_str, str):
            try:
                return json.loads(logit_bias_json_str)
            except json.JSONDecodeError as e:
                logging.warning(f"An error occurred while deserializing the logit bias string -- {str(e)}")
                
        return None
        
    @field_validator('stop_sequence', mode='before')
    @classmethod
    def split_contexts(cls, comma_separated_string: str) -> List[str]:
        if isinstance(comma_separated_string, str) and len(comma_separated_string) > 0:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def ensure_endpoint(self) -> Self:
        if self.endpoint:
            return Self
        
        elif self.resource:
            self.endpoint = f"https://{self.resource}.openai.azure.com"
            return Self
        
        raise ValidationError("AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_RESOURCE is required")
        
    def extract_embedding_dependency(self) -> Optional[dict]:
        if self.embedding_name:
            return {
                "type": "deployment_name",
                "deployment_name": self.embedding_name
            }
        elif self.embedding_endpoint:
            if self.embedding_key:
                return {
                    "type": "endpoint",
                    "endpoint": self.embedding_endpoint,
                    "authentication": {
                        "type": "api_key",
                        "key": self.embedding_key
                    }
                }
            else:
                return {
                    "type": "endpoint",
                    "endpoint": self.embedding_endpoint,
                    "authentication": {
                        "type": "system_assigned_managed_identity"
                    }
                }
        else:   
            return None
    

class _SearchCommonSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SEARCH_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )
    max_search_queries: Optional[int] = None
    allow_partial_result: bool = False
    include_contexts: Optional[List[str]] = ["citations", "intent"]
    vectorization_dimensions: Optional[int] = None
    role_information: str = Field(
        default="You are an AI assistant that helps people find information.",
        validation_alias="AZURE_OPENAI_SYSTEM_MESSAGE"
    )

    @field_validator('include_contexts', mode='before')
    @classmethod
    def split_contexts(cls, comma_separated_string: str, info: ValidationInfo) -> List[str]:
        if isinstance(comma_separated_string, str) and len(comma_separated_string) > 0:
            return parse_multi_columns(comma_separated_string)
        
        return cls.model_fields[info.field_name].get_default()


class DatasourcePayloadConstructor(BaseModel, ABC):
    _settings: '_AppSettings' = PrivateAttr()
    
    def __init__(self, settings: '_AppSettings', **data):
        super().__init__(**data)
        self._settings = settings
    
    @abstractmethod
    def construct_payload_configuration(
        self,
        *args,
        **kwargs
    ):
        pass


class _AzureSearchSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_SEARCH_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )
    _type: Literal["azure_search"] = PrivateAttr(default="azure_search")
    top_k: int = Field(default=5, serialization_alias="top_n_documents")
    strictness: int = 3
    enable_in_domain: bool = Field(default=True, serialization_alias="in_scope")
    service: str = Field(exclude=True)
    endpoint_suffix: str = Field(default="search.windows.net", exclude=True)
    index: str = Field(serialization_alias="index_name")
    key: Optional[str] = Field(default=None, exclude=True)
    use_semantic_search: bool = Field(default=False, exclude=True)
    semantic_search_config: str = Field(default="", serialization_alias="semantic_configuration")
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
        'vectorSimpleHybrid',
        'vector_semantic_hybrid',
        'vectorSemanticHybrid'
    ] = "simple"
    permitted_groups_column: Optional[str] = Field(default=None, exclude=True)
    
    # Constructed fields
    endpoint: Optional[str] = None
    authentication: Optional[dict] = None
    embedding_dependency: Optional[dict] = None
    fields_mapping: Optional[dict] = None
    filter: Optional[str] = Field(default=None, exclude=True)
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if isinstance(comma_separated_string, str) and len(comma_separated_string) > 0:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def set_endpoint(self) -> Self:
        self.endpoint = f"https://{self.service}.{self.endpoint_suffix}"
        return self
    
    @model_validator(mode="after")
    def set_authentication(self) -> Self:
        if self.key:
            self.authentication = {"type": "api_key", "key": self.key}
        else:
            self.authentication = {"type": "system_assigned_managed_identity"}
            
        return self
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_columns,
            "title_field": self.title_column,
            "url_field": self.url_column,
            "filepath_field": self.filename_column,
            "vector_fields": self.vector_columns
        }
        return self
    
    @model_validator(mode="after")
    def set_query_type(self) -> Self:
        self.query_type = to_snake(self.query_type)

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
        *args,
        **kwargs
    ):
        request = kwargs.pop('request', None)
        if request and self.permitted_groups_column:
            self.filter = self._set_filter_string(request)
            
        self.embedding_dependency = \
            self._settings.azure_openai.extract_embedding_dependency()
        parameters = self.model_dump(exclude_none=True, by_alias=True)
        parameters.update(self._settings.search.model_dump(exclude_none=True, by_alias=True))
        
        return {
            "type": self._type,
            "parameters": parameters
        }


class _AzureCosmosDbMongoVcoreSettings(
    BaseSettings,
    DatasourcePayloadConstructor
):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_COSMOSDB_MONGO_VCORE_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )
    _type: Literal["azure_cosmosdb"] = PrivateAttr(default="azure_cosmosdb")
    top_k: int = Field(default=5, serialization_alias="top_n_documents")
    strictness: int = 3
    enable_in_domain: bool = Field(default=True, serialization_alias="in_scope")
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
        if isinstance(comma_separated_string, str) and len(comma_separated_string) > 0:
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
            "content_fields": self.content_columns,
            "title_field": self.title_column,
            "url_field": self.url_column,
            "filepath_field": self.filename_column,
            "vector_fields": self.vector_columns
        }
        return self
    
    def construct_payload_configuration(
        self,
        *args,
        **kwargs
    ):
        self.embedding_dependency = \
            self._settings.azure_openai.extract_embedding_dependency()
        parameters = self.model_dump(exclude_none=True, by_alias=True)
        parameters.update(self._settings.search.model_dump(exclude_none=True, by_alias=True))
        return {
            "type": self._type,
            "parameters": parameters
        }


class _ElasticsearchSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="ELASTICSEARCH_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )
    _type: Literal["elasticsearch"] = PrivateAttr(default="elasticsearch")
    top_k: int = Field(default=5, serialization_alias="top_n_documents")
    strictness: int = 3
    enable_in_domain: bool = Field(default=True, serialization_alias="in_scope")
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
        if isinstance(comma_separated_string, str) and len(comma_separated_string) > 0:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def set_authentication(self) -> Self:
        self.authentication = {
            "type": "encoded_api_key",
            "encoded_api_key": self.encoded_api_key
        }
        
        return self
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_columns,
            "title_field": self.title_column,
            "url_field": self.url_column,
            "filepath_field": self.filename_column,
            "vector_fields": self.vector_columns
        }
        return self
    
    def construct_payload_configuration(
        self,
        *args,
        **kwargs
    ):
        self.embedding_dependency = \
            {"type": "model_id", "model_id": self.embedding_model_id} if self.embedding_model_id else \
            self._settings.azure_openai.extract_embedding_dependency() 
            
        parameters = self.model_dump(exclude_none=True, by_alias=True)
        parameters.update(self._settings.search.model_dump(exclude_none=True, by_alias=True))
                
        return {
            "type": self._type,
            "parameters": parameters
        }


class _PineconeSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="PINECONE_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )
    _type: Literal["pinecone"] = PrivateAttr(default="pinecone")
    top_k: int = Field(default=5, serialization_alias="top_n_documents")
    strictness: int = 3
    enable_in_domain: bool = Field(default=True, serialization_alias="in_scope")
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
        if isinstance(comma_separated_string, str) and len(comma_separated_string) > 0:
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
            "content_fields": self.content_columns,
            "title_field": self.title_column,
            "url_field": self.url_column,
            "filepath_field": self.filename_column,
            "vector_fields": self.vector_columns
        }
        return self
    
    def construct_payload_configuration(
        self,
        *args,
        **kwargs
    ):
        self.embedding_dependency = \
            self._settings.azure_openai.extract_embedding_dependency()
        parameters = self.model_dump(exclude_none=True, by_alias=True)
        parameters.update(self._settings.search.model_dump(exclude_none=True, by_alias=True))
        
        return {
            "type": self._type,
            "parameters": parameters
        }


class _AzureMLIndexSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_MLINDEX_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )
    _type: Literal["azure_ml_index"] = PrivateAttr(default="azure_ml_index")
    top_k: int = Field(default=5, serialization_alias="top_n_documents")
    strictness: int = 3
    enable_in_domain: bool = Field(default=True, serialization_alias="in_scope")
    name: str
    version: str
    project_resource_id: str = Field(validation_alias="AZURE_ML_PROJECT_RESOURCE_ID")
    content_columns: Optional[List[str]] = Field(default=None, exclude=True)
    vector_columns: Optional[List[str]] = Field(default=None, exclude=True)
    title_column: Optional[str] = Field(default=None, exclude=True)
    url_column: Optional[str] = Field(default=None, exclude=True)
    filename_column: Optional[str] = Field(default=None, exclude=True)
    
    # Constructed fields
    fields_mapping: Optional[dict] = None
    
    @field_validator('content_columns', 'vector_columns', mode="before")
    @classmethod
    def split_columns(cls, comma_separated_string: str) -> List[str]:
        if isinstance(comma_separated_string, str) and len(comma_separated_string) > 0:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_columns,
            "title_field": self.title_column,
            "url_field": self.url_column,
            "filepath_field": self.filename_column,
            "vector_fields": self.vector_columns
        }
        return self
    
    def construct_payload_configuration(
        self,
        *args,
        **kwargs
    ):
        parameters = self.model_dump(exclude_none=True, by_alias=True)
        parameters.update(self._settings.search.model_dump(exclude_none=True, by_alias=True))
        
        return {
            "type": self._type,
            "parameters": parameters
        }


class _AzureSqlServerSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_SQL_SERVER_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )
    _type: Literal["azure_sql_server"] = PrivateAttr(default="azure_sql_server")
    
    connection_string: str = Field(exclude=True)
    table_schema: str
    schema_max_row: Optional[int] = None
    top_n_results: Optional[int] = None
    
    # Constructed fields
    authentication: Optional[dict] = None
    
    @model_validator(mode="after")
    def construct_authentication(self) -> Self:
        self.authentication = {
            "type": "connection_string",
            "connection_string": self.connection_string
        }
        return self
    
    def construct_payload_configuration(
        self,
        *args,
        **kwargs
    ):
        parameters = self.model_dump(exclude_none=True, by_alias=True)
        #parameters.update(self._settings.search.model_dump(exclude_none=True, by_alias=True))
        
        return {
            "type": self._type,
            "parameters": parameters
        }
    

class _MongoDbSettings(BaseSettings, DatasourcePayloadConstructor):
    model_config = SettingsConfigDict(
        env_prefix="MONGODB_",
        env_file=DOTENV_PATH,
        extra="ignore",
        env_ignore_empty=True
    )
    _type: Literal["mongo_db"] = PrivateAttr(default="mongo_db")
    
    endpoint: str
    username: str = Field(exclude=True)
    password: str = Field(exclude=True)
    database_name: str
    collection_name: str
    app_name: str
    index_name: str
    query_type: Literal["vector"] = "vector"
    top_k: int = Field(default=5, serialization_alias="top_n_documents")
    strictness: int = 3
    enable_in_domain: bool = Field(default=True, serialization_alias="in_scope")
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
        if isinstance(comma_separated_string, str) and len(comma_separated_string) > 0:
            return parse_multi_columns(comma_separated_string)
        
        return None
    
    @model_validator(mode="after")
    def set_fields_mapping(self) -> Self:
        self.fields_mapping = {
            "content_fields": self.content_columns,
            "title_field": self.title_column,
            "url_field": self.url_column,
            "filepath_field": self.filename_column,
            "vector_fields": self.vector_columns
        }
        return self
    
    @model_validator(mode="after")
    def construct_authentication(self) -> Self:
        self.authentication = {
            "type": "username_and_password",
            "username": self.username,
            "password": self.password
        }
        return self
    
    def construct_payload_configuration(
        self,
        *args,
        **kwargs
    ):
        self.embedding_dependency = \
            self._settings.azure_openai.extract_embedding_dependency()
            
        parameters = self.model_dump(exclude_none=True, by_alias=True)
        parameters.update(self._settings.search.model_dump(exclude_none=True, by_alias=True))
        
        return {
            "type": self._type,
            "parameters": parameters
        }
        
        
class _BaseSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=DOTENV_PATH,
        extra="ignore",
        arbitrary_types_allowed=True,
        env_ignore_empty=True
    )
    datasource_type: Optional[str] = None
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
            
        return self
    
    @model_validator(mode="after")
    def set_chat_history_settings(self) -> Self:
        try:
            self.chat_history = _ChatHistorySettings()
        
        except ValidationError:
            self.chat_history = None
        
        return self
    
    @model_validator(mode="after")
    def set_datasource_settings(self) -> Self:
        try:
            if self.base_settings.datasource_type == "AzureCognitiveSearch":
                self.datasource = _AzureSearchSettings(settings=self, _env_file=DOTENV_PATH)
                logging.debug("Using Azure Cognitive Search")
            
            elif self.base_settings.datasource_type == "AzureCosmosDB":
                self.datasource = _AzureCosmosDbMongoVcoreSettings(settings=self, _env_file=DOTENV_PATH)
                logging.debug("Using Azure CosmosDB Mongo vcore")
            
            elif self.base_settings.datasource_type == "Elasticsearch":
                self.datasource = _ElasticsearchSettings(settings=self, _env_file=DOTENV_PATH)
                logging.debug("Using Elasticsearch")
            
            elif self.base_settings.datasource_type == "Pinecone":
                self.datasource = _PineconeSettings(settings=self, _env_file=DOTENV_PATH)
                logging.debug("Using Pinecone")
            
            elif self.base_settings.datasource_type == "AzureMLIndex":
                self.datasource = _AzureMLIndexSettings(settings=self, _env_file=DOTENV_PATH)
                logging.debug("Using Azure ML Index")
            
            elif self.base_settings.datasource_type == "AzureSqlServer":
                self.datasource = _AzureSqlServerSettings(settings=self, _env_file=DOTENV_PATH)
                logging.debug("Using SQL Server")
            
            elif self.base_settings.datasource_type == "MongoDB":
                self.datasource = _MongoDbSettings(settings=self, _env_file=DOTENV_PATH)
                logging.debug("Using Mongo DB")
                
            else:
                self.datasource = None
                logging.warning("No datasource configuration found in the environment -- calls will be made to Azure OpenAI without grounding data.")
                
            return self

        except ValidationError as e:
            logging.warning("No datasource configuration found in the environment -- calls will be made to Azure OpenAI without grounding data.")
            logging.warning(e.errors())


app_settings = _AppSettings()
