import os
import pytest
from tempfile import NamedTemporaryFile
from importlib import import_module, reload
from jinja2 import FileSystemLoader
from jinja2 import Environment
from quart import Quart


datasources = [
    "AzureCognitiveSearch",
    "Elasticsearch",
    "none"  # TODO: add tests for additional data sources
]


def render_template_to_tempfile(
    template_prefix,
    input_template,
    **template_params
):
    template_environment = Environment()
    template_environment.loader = FileSystemLoader(
        os.path.dirname(input_template)
    )
    template_environment.trim_blocks = True
    template = template_environment.get_template(
        os.path.basename(input_template)
    )

    with NamedTemporaryFile(
        'w',
        prefix=f"{template_prefix}-",
        delete=False
    ) as g:
        g.write(template.render(**template_params))
        rendered_output = g.name

    print(f"Rendered template at {rendered_output}")
    return rendered_output


@pytest.fixture(scope="function", params=datasources, ids=datasources)
def datasource(request):
    return request.param


@pytest.fixture(scope="function", params=[True, False], ids=["with_chat_history", "no_chat_history"])
def enable_chat_history(request):
    return request.param


@pytest.fixture(scope="function", params=[True, False], ids=["streaming", "nonstreaming"])
def stream(request):
    return request.param


@pytest.fixture(scope="function", params=[True, False], ids=["with_aoai_embeddings", "no_aoai_embeddings"])
def use_aoai_embeddings(request):
    return request.param


@pytest.fixture(scope="function", params=[True, False], ids=["with_es_embeddings", "no_es_embeddings"])
def use_elasticsearch_embeddings(request):
    return request.param

@pytest.fixture(scope="function", params=[True, False], ids=["use_mi", "use_keys"])
def use_mi(request):
    return request.param


@pytest.fixture(scope="function")
def dotenv_rendered_template_path(
    request,
    dotenv_template_params,
    datasource,
    enable_chat_history,
    stream, 
    use_aoai_embeddings,
    use_elasticsearch_embeddings, 
    use_mi
):
    rendered_template_name = request.node.name.replace("[", "_").replace("]", "_")
    template_path = os.path.join(
        os.path.dirname(__file__),
        "dotenv_templates",
        "dotenv.jinja2"
    )

    if datasource != "none":
        dotenv_template_params["DATASOURCE_TYPE"] = datasource
    
    if datasource != "Elasticsearch" and use_elasticsearch_embeddings:
        pytest.skip("Elasticsearch embeddings not supported for test.")
        
    if datasource == "Elasticsearch":
        dotenv_template_params["USE_ELASTICSEARCH_EMBEDDINGS"] = use_elasticsearch_embeddings
    
    dotenv_template_params["USE_AOAI_EMBEDDINGS"] = use_aoai_embeddings
    dotenv_template_params["USE_MI"] = use_mi
    
    if use_aoai_embeddings or use_elasticsearch_embeddings:
        dotenv_template_params["AZURE_SEARCH_QUERY_TYPE"] = "vector"
        dotenv_template_params["ELASTICSEARCH_QUERY_TYPE"] = "vector"
    else:
        dotenv_template_params["AZURE_SEARCH_QUERY_TYPE"] = "simple"
        dotenv_template_params["ELASTICSEARCH_QUERY_TYPE"] = "simple"
    
    dotenv_template_params["ENABLE_CHAT_HISTORY"] = enable_chat_history
    dotenv_template_params["AZURE_OPENAI_STREAM"] = stream
    
    return render_template_to_tempfile(
        rendered_template_name,
        template_path,
        **dotenv_template_params
    )


@pytest.fixture(scope="function")
def test_app(dotenv_rendered_template_path) -> Quart:
    os.environ["DOTENV_PATH"] = dotenv_rendered_template_path
    app_module = import_module("app")
    app_module = reload(app_module)
    
    app = getattr(app_module, "app")
    return app


@pytest.mark.asyncio
async def test_dotenv(test_app: Quart, dotenv_template_params: dict[str, str]):
    if dotenv_template_params["DATASOURCE_TYPE"] == "AzureCognitiveSearch":
        message_content = dotenv_template_params["AZURE_SEARCH_QUERY"]
        
    elif dotenv_template_params["DATASOURCE_TYPE"] == "Elasticsearch":
        message_content = dotenv_template_params["ELASTICSEARCH_QUERY"]
        
    else:
        message_content = "What is Contoso?"
        
    request_path = "/conversation"
    request_data = {
        "messages": [
            {
                "role": "user",
                "content": message_content
            }
        ]
    }
    
    test_client = test_app.test_client()
    response = await test_client.post(request_path, json=request_data)
    assert response.status_code == 200
    response_content = await response.get_data()
    print(response_content)
