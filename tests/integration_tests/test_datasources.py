import os
import pytest
from requests import post
from subprocess import Popen
from tempfile import NamedTemporaryFile
from jinja2 import FileSystemLoader
from jinja2 import Environment


def render_template_to_tempfile(
    template_prefix,
    input_template,
    **template_params
):
    template_environment = Environment()
    template_environment.loader = FileSystemLoader(
        os.path.dirname(input_template)
    )

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


@pytest.fixture(scope="function")
def dotenv_rendered_template_path(request, dotenv_template_params):
    test_case_name = request.node.originalname.partition("test_")[2]
    template_path = os.path.join(
        os.path.dirname(__file__),
        "dotenv_templates",
        test_case_name
    )
    return render_template_to_tempfile(
        test_case_name,
        template_path,
        **dotenv_template_params
    )


@pytest.fixture(scope="function")
def start_app(dotenv_rendered_template_path):
    startup_command = ["python", "-m", "quart", "run", "--no-reload", "50505"]
    app_process = Popen(
        startup_command,
        env={"DOTENV_PATH": dotenv_rendered_template_path}
    )
    yield
    app_process.terminate()


def test_dotenv_no_datasource(start_app):
    request_url = "http://localhost:50505/conversation"
    request_data = {
        "messages": [
            {
                "role": "user",
                "content": "What is Contoso?"
            }
        ]
    }
    
    response = post(request_url, data=request_data)


# def test_dotenv_with_azure_search_success(start_app):
#     pass


# def test_dotenv_with_elasticsearch_success(start_app):
#     pass