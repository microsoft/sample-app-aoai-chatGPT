import json
import os
import pytest
from importlib import import_module, reload


@pytest.fixture(scope="function")
def dotenv_path(request):
    test_case_name = request.node.originalname.partition("test_")[2]
    return os.path.join(
        os.path.dirname(__file__),
        "dotenv_data",
        test_case_name
    )


@pytest.fixture(scope="function")
def app_settings(dotenv_path):
    # Reload module object to pick up new environment
    os.environ["DOTENV_PATH"] = dotenv_path
    settings_module = import_module("backend.settings")
    settings_module = reload(settings_module)
    print(os.environ.items())
    
    yield getattr(settings_module, "app_settings")


def test_dotenv_no_datasource_1(app_settings):    
    # Validate model object
    assert app_settings.base_settings.datasource_type is None
    assert app_settings.datasource is None
    assert app_settings.azure_openai is not None
    
    
def test_dotenv_no_datasource_2(app_settings):    
    # Validate model object
    assert app_settings.datasource is None
    assert app_settings.azure_openai is not None

    
def test_dotenv_with_azure_search_success(app_settings):
    # Validate model object
    assert app_settings.search is not None
    assert app_settings.base_settings.datasource_type == "AzureCognitiveSearch"
    assert app_settings.datasource is not None
    assert app_settings.datasource.service == "search_service"
    assert app_settings.azure_openai is not None
    
    # Validate API payload structure
    payload = app_settings.datasource.construct_payload_configuration()
    assert payload["type"] == "azure_search"
    assert payload["parameters"] is not None
    assert payload["parameters"]["endpoint"] == "https://search_service.search.windows.net"
    print(payload)


def test_dotenv_with_elasticsearch_success(app_settings):
    # Validate model object
    assert app_settings.search is not None
    assert app_settings.base_settings.datasource_type == "Elasticsearch"
    assert app_settings.datasource is not None
    assert app_settings.datasource.endpoint == "dummy"
    assert app_settings.azure_openai is not None
    
    # Validate API payload structure
    payload = app_settings.datasource.construct_payload_configuration()
    assert payload["type"] == "elasticsearch"
    assert payload["parameters"] is not None
    assert payload["parameters"]["endpoint"] == "dummy"
    print(payload)
    
    
def test_dotenv_with_embedding_dependency_1(app_settings):
    # Validate model object
    assert app_settings.azure_openai is not None
    assert app_settings.azure_openai.embedding_name == "embedding_model", app_settings.model_dump()
    
    # Validate API payload structure
    payload = app_settings.datasource.construct_payload_configuration()
    assert payload["parameters"]["embedding_dependency"]["type"] == "deployment_name", json.dumps(payload)
    assert payload["parameters"]["embedding_dependency"]["deployment_name"] == "embedding_model", json.dumps(payload)
    print(payload)


def test_dotenv_with_embedding_dependency_2(app_settings):
    # Validate model object
    assert app_settings.azure_openai is not None
    assert app_settings.azure_openai.embedding_endpoint == "https://embeddings.openai.azure.com"
    assert app_settings.azure_openai.embedding_key == "dummy"
    
    # Validate API payload structure
    payload = app_settings.datasource.construct_payload_configuration()
    assert payload["parameters"]["embedding_dependency"]["type"] == "endpoint", json.dumps(payload)
    assert payload["parameters"]["embedding_dependency"]["authentication"]["type"] == "api_key"
    assert payload["parameters"]["embedding_dependency"]["authentication"]["key"] == "dummy"
    print(payload)
    

def test_dotenv_with_embedding_dependency_3(app_settings):
    # Validate model object
    assert app_settings.azure_openai is not None
    assert app_settings.azure_openai.embedding_endpoint == "https://embeddings.openai.azure.com"
    assert app_settings.azure_openai.embedding_key == None
    
    # Validate API payload structure
    payload = app_settings.datasource.construct_payload_configuration()
    assert payload["parameters"]["embedding_dependency"]["type"] == "endpoint", json.dumps(payload)
    assert payload["parameters"]["embedding_dependency"]["authentication"]["type"] == "system_assigned_managed_identity"
    print(payload)
    
    
    

