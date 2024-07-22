# This workflow will install Python dependencies, run tests and lint with a single version of Python
# For more information see: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-python

name: Python application

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

permissions:
  contents: read

jobs:
  test_linux:
    runs-on:
    - ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python 3.11
      uses: actions/setup-python@v3
      with:
        python-version: "3.11"
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements-dev.txt
    - name: Test with pytest
      env:
        AZURE_OPENAI_ENDPOINT: ${{ secrets.AZUREOPENAIENDPOINT }}
        AZURE_OPENAI_MODEL: ${{ secrets.AZUREOPENAIMODEL }}
        AZURE_OPENAI_KEY: ${{ secrets.AZUREOPENAIKEY }}
        AZURE_OPENAI_EMBEDDING_NAME: ${{ secrets.AZUREOPENAIEMBEDDINGNAME }}
        AZURE_COSMOSDB_ACCOUNT: ${{ secrets.AZURECOSMOSDBACCOUNT }}
        AZURE_COSMOSDB_DATABASE: ${{ secrets.AZURECOSMOSDBDATABASE }}
        AZURE_COSMOSDB_CONVERSATIONS_CONTAINER: ${{ secrets.AZURECOSMOSDBCONVERSATIONSCONTAINER }}
        AZURE_COSMOSDB_ACCOUNT_KEY: ${{ secrets.AZURECOSMOSDBACCOUNTKEY }}
        AZURE_SEARCH_SERVICE: ${{ secrets.AZURESEARCHSERVICE }}
        AZURE_SEARCH_INDEX: ${{ secrets.AZURESEARCHINDEX }}
        AZURE_SEARCH_KEY: ${{ secrets.AZURESEARCHKEY }}
        AZURE_SEARCH_QUERY: ${{ secrets.AZURESEARCHQUERY }}
        ELASTICSEARCH_EMBEDDING_MODEL_ID: ${{ secrets.ELASTICSEARCHEMBEDDINGMODELID }}
        ELASTICSEARCH_ENCODED_API_KEY: ${{ secrets.ELASTICSEARCHENCODEDAPIKEY }}
        ELASTICSEARCH_ENDPOINT: ${{ secrets.ELASTICSEARCHENDPOINT }}
        ELASTICSEARCH_INDEX: ${{ secrets.ELASTICSEARCHINDEX }}
        ELASTICSEARCH_QUERY: ${{ secrets.ELASTICSEARCHQUERY }}
      run: |
        export PYTHONPATH=$(pwd)
        coverage run -m pytest -v --show-capture=stdout
        coverage report -m --include=app.py,backend/*,tests/*
        coverage xml

    - name: Code Coverage Report
      uses: irongut/CodeCoverageSummary@v1.3.0
      with:
        filename: coverage.xml
        badge: true
        fail_below_min: true
        format: markdown
        hide_branch_rate: false
        hide_complexity: true
        indicators: true
        output: both
        thresholds: '50 80'

  test_windows:
    runs-on:
    - windows-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python 3.11
      uses: actions/setup-python@v3
      with:
        python-version: "3.11"
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements-dev.txt
    - name: Test with pytest
      run: |
        $env:PYTHONPATH=$pwd
        pytest -v --show-capture=stdout -k "not integration"
