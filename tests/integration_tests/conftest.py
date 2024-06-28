import json
import os
import pytest
from azure.identity import AzureCliCredential
from azure.keyvault.secrets import SecretClient


VAULT_NAME = os.environ.get("VAULT_NAME")


@pytest.fixture(scope="module")
def secret_client() -> SecretClient: 
    kv_uri = f"https://{VAULT_NAME}.vault.azure.net"
    print(f"init secret_client from kv_uri={kv_uri}")
    credential = AzureCliCredential(additionally_allowed_tenants="*")
    return SecretClient(vault_url=kv_uri, credential=credential)


@pytest.fixture(scope="module")
def dotenv_template_params_from_kv(secret_client: SecretClient) -> dict[str, str]:
    secrets_properties_list = secret_client.list_properties_of_secrets()
    secrets = {}
    for secret in secrets_properties_list:
        secrets[secret.name] = secret_client.get_secret(secret.name).value
        
    return secrets


@pytest.fixture(scope="module")
def dotenv_template_params_from_env() -> dict[str, str]:
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
    
    return {s: os.getenv(s) for s in env_secrets}

