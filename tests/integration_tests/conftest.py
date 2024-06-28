import json
import os
import pytest

@pytest.fixture(scope="module")
def dotenv_template_params_from_env() -> dict[str, str]:
    def get_and_unset_variable(var_name):
        # we need this function to ensure that the environment is clean before
        # testing with generated dotenv files.
        var_value = os.getenv(var_name)
        os.environ[var_name] = ""
        return var_value
        
    env_secrets = [
        "AZURE_COSMOSDB_ACCOUNT",
        "AZURE_COSMOSDB_ACCOUNT_KEY",
        "AZURE_COSMOSDB_CONVERSATIONS_CONTAINER",
        "AZURE_COSMOSDB_DATABASE",
        "AZURE_OPENAI_EMBEDDING_NAME"
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_MODEL",
        "AZURE_OPENAI_KEY",
        "AZURE_SEARCH_INDEX",
        "AZURE_SEARCH_KEY",
        "AZURE_SEARCH_QUERY",
        "AZURE_SEARCH_SERVICE",
        "ELASTICSEARCH_EMBEDDING_MODEL_ID",
        "ELASTICSEARCH_ENCODED_API_KEY",
        "ELASTICSEARCH_ENDPOINT",
        "ELASTICSEARCH_INDEX",
        "ELASTICSEARCH_QUERY"
    ]
    
    return {s: get_and_unset_variable(s) for s in env_secrets}

