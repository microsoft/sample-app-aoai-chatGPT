from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Literal, Optional, Union
from typing_extensions import Annotated


class AzureOpenAISettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_OPENAI_",
        env_file=".env",
        extra='ignore'
    )


class DataSourceCommonParameters(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SEARCH_",
        env_file=".env",
        extra='ignore'
    )
    top_k: Optional[int] = 5
    strictness: Optional[int] = 3
    in_domain: Optional[bool] = True
    max_search_queries: Optional[int] = None
    allow_partial_result: Optional[bool] = False
    include_contexts: Optional[List[str]] = None

    @field_validator('include_contexts', mode='before')
    @classmethod
    def split_columns(cls, comma_separated_string: str):
        '''
        Split comma-separated values into a list.
        '''
        return comma_separated_string.strip().replace(' ', '').split(',')


class AzureSearchDataSourceParameters(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AZURE_SEARCH_",
        env_file=".env",
        extra='ignore'
    )


class AzureSearchDataSource(BaseModel):
    type: Literal['AzureCognitiveSearch', 'azure_search'] = 'azure_search'
    parameters: AzureSearchDataSourceParameters


DataSource = Annotated[Union[AzureSearchDataSource,], Field(discriminator="type")]