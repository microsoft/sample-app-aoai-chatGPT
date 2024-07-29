import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--use-keyvault-secrets",
        help='Get secrets from a keyvault instead of the environment.',
        action='store_true', default=False
)


@pytest.fixture(scope="session")
def use_keyvault_secrets(request) -> str:
    return request.config.getoption("use_keyvault_secrets")