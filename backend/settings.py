from pydantic import BaseSettings, Field, conint, conlist, confloat
from typing import Optional, List

class _PromptflowSettings(BaseSettings):
    env_prefix: str = "PROMPTFLOW_"

class _AzureOpenAITool:
    pass

class _AzureCosmosDbMongoVcoreSettings(BaseSettings):
    env_prefix: str = "AZURE_COSMOSDB_MONGO_VCORE_"

class Settings(BaseSettings):
    choices_count: Optional[conint(ge=1, le=128)] = Field(default=1, serialization_alias="n")
    tools: Optional[List[_AzureOpenAITool]] = None
    presence_penalty: Optional[confloat(ge=-2.0, le=2.0)] = 0.0
    frequency_penalty: Optional[confloat(ge=-2.0, le=2.0)] = 0.0
    use_promptflow: bool = False
    promptflow: Optional[_PromptflowSettings] = None

    def set_promptflow_settings(self) -> 'Settings':
        self.promptflow = _PromptflowSettings()
        return self

    def clear_promptflow_settings(self) -> 'Settings':
        self.promptflow = None
        return self

    def set_datasource(self):
        self.datasource = _AzureCosmosDbMongoVcoreSettings(settings=self, _env_file=DOTENV_PATH)
        logging.debug("Using Azure CosmosDB Mongo vcore")

    def extract_embedding_dependency(self):
        self._settings.azure_openai.extract_embedding_dependency()