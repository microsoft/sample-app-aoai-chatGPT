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
def dotenv_template_params(secret_client: SecretClient) -> dict[str, str]:
    secrets_properties_list = secret_client.list_properties_of_secrets()
    secrets = {}
    for secret in secrets_properties_list:
        secrets[secret.name] = secret_client.get_secret(secret.name).value
        
    return secrets


