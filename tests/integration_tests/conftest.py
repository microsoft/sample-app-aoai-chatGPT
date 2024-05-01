import os
import pytest
from azure.identity import AzureCliCredential
from azure.keyvault.secrets import SecretClient


VAULT_NAME = os.environ.get("VAULT_NAME")

def secret_client() -> SecretClient:    
    kv_uri = f"https://{VAULT_NAME}.vault.azure.net"
    print(f"init secret_client from kv_uri={kv_uri}")
    credential = AzureCliCredential(additionally_allowed_tenants="*")
    return SecretClient(vault_url=kv_uri, credential=credential)

@pytest.fixture(scope="module")
def dotenv_template_params():
    pass
