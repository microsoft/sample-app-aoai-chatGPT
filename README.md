# [Preview] Sample Chat App with AOAI

This repo contains sample code for a simple chat webapp that integrates with Azure OpenAI. Note: some portions of the app use preview APIs.

## Prerequisites
- An existing Azure OpenAI resource and model deployment of a chat model (e.g. `gpt-35-turbo-16k`, `gpt-4`)
- To use Azure OpenAI on your data, one of the following data sources:
  - Azure AI Search Index
  - Azure CosmosDB Mongo vCore vector index
  - Elasticsearch index (preview)
  - Pinecone index (private preview)
  - Azure SQL Server (private preview)
  - Mongo DB (preview)

## Configure the app

### Create a .env file for local development

Follow instructions below in the [app configuration](#app-settings) section to create a .env file for local development of your app.  This file can be used as a reference to populate the app settings for your Azure App Service deployed webapp.

### Create a JSON file for populating Azure App Service app settings

After creating your .env file, run one of the following commands in your preferred shell to create a JSON representation of your environment which is recognized by Azure App Service.

#### Powershell
```powershell
Get-Content .env | ForEach-Object {   
     if ($_ -match "(?<name>[A-Z_]+)=(?<value>.*)") {   
         [PSCustomObject]@{   
             name = $matches["name"]   
             value = $matches["value"]   
             slotSetting = $false  
         }  
    }  
} | ConvertTo-Json | Out-File -FilePath env.json
```

#### Bash
```bash
cat .env | jq -R '. | capture("(?<name>[A-Z_]+)=(?<value>.*)")' | jq -s '.[].slotSetting=false' > env.json
```

## Deploy the app

### Deploy with Azure Developer CLI
Please see [README_azd.md](./README_azd.md) for detailed instructions.

### One click Azure deployment
[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmicrosoft%2Fsample-app-aoai-chatGPT%2Fmain%2Finfrastructure%2Fdeployment.json)

Click on the Deploy to Azure button and configure your settings in the Azure Portal as described in the [Environment variables](#environment-variables) section.

Please see the [section below](#add-an-identity-provider) for important information about adding authentication to your app.

### Deploy from your local machine

1. Follow the steps below in the [app configuration](#app-settings) section to construct your .env file with the appropriate variables for your use case.

2. Start the app with `start.cmd`. This will build the frontend, install backend dependencies, and then start the app. Or, just run the backend in debug mode using the VSCode debug configuration in `.vscode/launch.json`.

3. You can see the local running app at http://127.0.0.1:50505.

### Deploy with the Azure CLI

#### Create the Azure App Service
**NOTE**: If you've made code changes, be sure to **build the app code** with `start.cmd` or `start.sh` before you deploy, otherwise your changes will not be picked up. If you've updated any files in the `frontend` folder, make sure you see updates to the files in the `static` folder before you deploy.

You can use the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) to deploy the app from your local machine. Make sure you have version 2.48.1 or later.

If this is your first time deploying the app, you can use [az webapp up](https://learn.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-up). Run the following command from the root folder of the repo, updating the placeholder values to your desired app name, resource group, location, and subscription. You can also change the SKU if desired.

`az webapp up --runtime PYTHON:3.11 --sku B1 --name <new-app-name> --resource-group <resource-group-name> --location <azure-region> --subscription <subscription-name>`

Note: if using the Azure CLI version 2.62 or greater, you may also want to add the flag `--track-status False` to prevent the command from failing due to startup errors.  Startup errors can be solved by following the instructions in the next section about [updating app configuration](#update-app-configuration).

#### Update app configuration

After creating your Azure App Service, follow these steps to update the configuration to allow your application to properly start up.

1. Set the app startup command
```
az webapp config set --startup-file "python3 -m gunicorn app:app" --name <new-app-name>
```
2. Set `WEBSITE_WEBDEPLOY_USE_SCM=false` to allow local code deployment.
```
az webapp config appsettings set -g <resource-group-name> -n <existing-app-name> --settings WEBSITE_WEBDEPLOY_USE_SCM=false
```
3. Set all of your app settings in your local .env file at once by [creating a JSON representation](#create-a-json-file-for-populating-azure-app-service-app-settings) of the .env file, and then run the following command.
```
az webapp config appsettings set -g <resource-group-name> -n <existing-app-name> --settings "@env.json"
```

#### Update an existing app

Check the runtime stack for your app by viewing the app service resource in the Azure Portal. If it shows "Python - 3.10", use `PYTHON:3.10` in the runtime argument below. If it shows "Python - 3.11", use `PYTHON:3.11` in the runtime argument below. 

Check the SKU in the same way. Use the abbreviated SKU name in the argument below, e.g. for "Basic (B1)" the SKU is `B1`. 

Then, use these commands to deploy your local code to the existing app:

1. `az webapp up --runtime <runtime-stack> --sku <sku> --name <existing-app-name> --resource-group <resource-group-name>`
1. `az webapp config set --startup-file "python3 -m gunicorn app:app" --name <existing-app-name>`

Make sure that the app name and resource group match exactly for the app that was previously deployed.

Deployment will take several minutes. When it completes, you should be able to navigate to your app at {app-name}.azurewebsites.net.

## Authentication

### Add an identity provider
After deployment, you will need to add an identity provider to provide authentication support in your app. See [this tutorial](https://learn.microsoft.com/en-us/azure/app-service/scenario-secure-app-authentication-app-service) for more information.

If you don't add an identity provider, the chat functionality of your app will be blocked to prevent unauthorized access to your resources and data. 

To remove this restriction, you can add `AUTH_ENABLED=False` to the environment variables. This will disable authentication and allow anyone to access the chat functionality of your app. **This is not recommended for production apps.**

To add further access controls, update the logic in `getUserInfoList` in `frontend/src/pages/chat/Chat.tsx`. 

### Using Microsoft Entra ID

To enable Microsoft Entra ID for intra-service authentication:

1. Enable managed identity on Azure OpenAI
2. Configure AI search to allow access from Azure OpenAI
   1. Enable Role Based Access control on the used AI search instance [(see documentation)](https://learn.microsoft.com/en-us/azure/search/search-security-enable-roles)
   2. Assign `Search Index Data Reader` and `Search Service Contributor` to the identity of the Azure OpenAI instance
3. Do not configure `AZURE_SEARCH_KEY` and `AZURE_OPENAI_KEY` to use Entra ID authentication.
4. Configure the webapp identity
   1. Enable managed identity in the app service that hosts the webapp
   2. Go to the Azure OpenAI instance and assign the role `Cognitive Services OpenAI User` to the identity of the webapp

Note: RBAC assignments can take a few minutes before becoming effective.

## App Configuration

### App Settings

#### Basic Chat Experience
1. Copy `.env.sample` to a new file called `.env` and configure the settings as described in the table below.

    | App Setting | Required? | Default Value | Note |
    | --- | --- | --- | ------------- |
    |AZURE_OPENAI_RESOURCE| Only if `AZURE_OPENAI_ENDPOINT` is not set || The name of your Azure OpenAI resource (only one of AZURE_OPENAI_RESOURCE/AZURE_OPENAI_ENDPOINT is required)|
    |AZURE_OPENAI_ENDPOINT| Only if `AZURE_OPENAI_RESOURCE` is not set ||The endpoint of your Azure OpenAI resource (only one of AZURE_OPENAI_RESOURCE/AZURE_OPENAI_ENDPOINT is required)|
    |AZURE_OPENAI_MODEL|Yes||The name of your model deployment|
    |AZURE_OPENAI_KEY|Optional if using Microsoft Entra ID -- see our documentation on the required resource setup for identity-based authentication.||One of the API keys of your Azure OpenAI resource|
    |AZURE_OPENAI_TEMPERATURE|No|0|What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. A value of 0 is recommended when using your data.|
    |AZURE_OPENAI_TOP_P|No|1.0|An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. We recommend setting this to 1.0 when using your data.|
    |AZURE_OPENAI_MAX_TOKENS|No|1000|The maximum number of tokens allowed for the generated answer.|
    |AZURE_OPENAI_STOP_SEQUENCE|No||Up to 4 sequences where the API will stop generating further tokens. Represent these as a string joined with "|", e.g. `"stop1|stop2|stop3"`|
    |AZURE_OPENAI_SYSTEM_MESSAGE|No|You are an AI assistant that helps people find information.|A brief description of the role and tone the model should use|
    |AZURE_OPENAI_STREAM|No|True|Whether or not to use streaming for the response. Note: Setting this to true prevents the use of prompt flow.|
    |AZURE_OPENAI_EMBEDDING_NAME|Only if using vector search using an Azure OpenAI embedding model||The name of your embedding model deployment if using vector search.

    See the [documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/reference#example-response-2) for more information on these parameters.


#### Chat with your data

[More information about Azure OpenAI on your data](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/concepts/use-your-data)

#### Chat with your data using Azure Cognitive Search

1. Update the `AZURE_OPENAI_*` environment variables as described in the [basic chat experience](#basic-chat-experience) above. 

2. To connect to your data, you need to specify an Azure Cognitive Search index to use. You can [create this index yourself](https://learn.microsoft.com/en-us/azure/search/search-get-started-portal) or use the [Azure AI Studio](https://oai.azure.com/portal/chat) to create the index for you.

3. Configure data source settings as described in the table below.

    | App Setting | Required? | Default Value | Note |
    | --- | --- | --- | ------------- |
    |DATASOURCE_TYPE|Yes||Must be set to `AzureCognitiveSearch`|
    |AZURE_SEARCH_SERVICE|Yes||The name of your Azure AI Search resource|
    |AZURE_SEARCH_INDEX|Yes||The name of your Azure AI Search Index|
    |AZURE_SEARCH_KEY|Optional if using Microsoft Entra ID -- see our documentation on the required resource setup for identity-based authentication.||An **admin key** for your Azure AI Search resource.|
    |AZURE_SEARCH_USE_SEMANTIC_SEARCH|No|False|Whether or not to use semantic search|
    |AZURE_SEARCH_QUERY_TYPE|No|simple|Query type: simple, semantic, vector, vectorSimpleHybrid, or vectorSemanticHybrid. Takes precedence over AZURE_SEARCH_USE_SEMANTIC_SEARCH|
    |AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG|No||The name of the semantic search configuration to use if using semantic search.|
    |AZURE_SEARCH_TOP_K|No|5|The number of documents to retrieve when querying your search index.|
    |AZURE_SEARCH_ENABLE_IN_DOMAIN|No|True|Limits responses to only queries relating to your data.|
    |AZURE_SEARCH_STRICTNESS|No|3|Integer from 1 to 5 specifying the strictness for the model limiting responses to your data.|
    |AZURE_SEARCH_CONTENT_COLUMNS|No||List of fields in your search index that contains the text content of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
    |AZURE_SEARCH_FILENAME_COLUMN|No|| Field from your search index that gives a unique identifier of the source of your data to display in the UI.|
    |AZURE_SEARCH_TITLE_COLUMN|No||Field from your search index that gives a relevant title or header for your data content to display in the UI.|
    |AZURE_SEARCH_URL_COLUMN|No||Field from your search index that contains a URL for the document, e.g. an Azure Blob Storage URI. This value is not currently used.|
    |AZURE_SEARCH_VECTOR_COLUMNS|No||List of fields in your search index that contain vector embeddings of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
    |AZURE_SEARCH_PERMITTED_GROUPS_COLUMN|No||Field from your Azure AI Search index that contains AAD group IDs that determine document-level access control.|

    When using your own data with a vector index, ensure these settings are configured on your app:
    - `AZURE_SEARCH_QUERY_TYPE`: can be `vector`, `vectorSimpleHybrid`, or `vectorSemanticHybrid`,
    - `AZURE_OPENAI_EMBEDDING_NAME`: the name of your Ada (text-embedding-ada-002) model deployment on your Azure OpenAI resource.
    - `AZURE_SEARCH_VECTOR_COLUMNS`: the vector columns in your index to use when searching. Join them with `|` like `contentVector|titleVector`.

#### Chat with your data using Azure Cosmos DB

1. Update the `AZURE_OPENAI_*` environment variables as described in the [basic chat experience](#basic-chat-experience) above. 

2. To connect to your data, you need to specify an Azure Cosmos DB database configuration.  Learn more about [creating an Azure Cosmos DB resource](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/quickstart-portal).

3. Configure data source settings as described in the table below.

    | App Setting | Required? | Default Value | Note |
    | --- | --- | --- | ------------- |
    |DATASOURCE_TYPE|Yes||Must be set to `AzureCosmosDB`|
    |AZURE_COSMOSDB_MONGO_VCORE_CONNECTION_STRING|Yes||The connection string used to connect to your Azure Cosmos DB instance|
    |AZURE_COSMOSDB_MONGO_VCORE_INDEX|Yes||The name of your Azure Cosmos DB vector index|
    |AZURE_COSMOSDB_MONGO_VCORE_DATABASE|Yes||The name of your Azure Cosmos DB database|
    |AZURE_COSMOSDB_MONGO_VCORE_CONTAINER|Yes||The name of your Azure Cosmos DB container|
    |AZURE_COSMOSDB_MONGO_VCORE_TOP_K|No|5|The number of documents to retrieve when querying your search index.|
    |AZURE_COSMOSDB_MONGO_VCORE_ENABLE_IN_DOMAIN|No|True|Limits responses to only queries relating to your data.|
    |AZURE_COSMOSDB_MONGO_VCORE_STRICTNESS|No|3|Integer from 1 to 5 specifying the strictness for the model limiting responses to your data.|
    |AZURE_COSMOSDB_MONGO_VCORE_CONTENT_COLUMNS|No||List of fields in your search index that contains the text content of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
    |AZURE_COSMOSDB_MONGO_VCORE_FILENAME_COLUMN|No|| Field from your search index that gives a unique identifier of the source of your data to display in the UI.|
    |AZURE_COSMOSDB_MONGO_VCORE_TITLE_COLUMN|No||Field from your search index that gives a relevant title or header for your data content to display in the UI.|
    |AZURE_COSMOSDB_MONGO_VCORE_URL_COLUMN|No||Field from your search index that contains a URL for the document, e.g. an Azure Blob Storage URI. This value is not currently used.|
    |AZURE_COSMOSDB_MONGO_VCORE_VECTOR_COLUMNS|No||List of fields in your search index that contain vector embeddings of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|

    Azure Cosmos DB uses vector search by default, so ensure these settings are configured on your app:
    - `AZURE_OPENAI_EMBEDDING_NAME`: the name of your Ada (text-embedding-ada-002) model deployment on your Azure OpenAI resource.
    - `AZURE_COSMOSDB_MONGO_VCORE_VECTOR_COLUMNS`: the vector columns in your index to use when searching. Join them with `|` like `contentVector|titleVector`.

#### Chat with your data using Elasticsearch (Preview)

1. Update the `AZURE_OPENAI_*` environment variables as described in the [basic chat experience](#basic-chat-experience) above. 

2. To connect to your data, you need to specify an Elasticsearch cluster configuration. Learn more about [Elasticsearch](https://www.elastic.co/).

3. Configure data source settings as described in the table below.

    | App Setting | Required? | Default Value | Note |
    | --- | --- | --- | ------------- |
    |DATASOURCE_TYPE|Yes||Must be set to `Elasticsearch`|
    |ELASTICSEARCH_ENDPOINT|Yes||The base URL of your Elasticsearch cluster API|
    |ELASTICSEARCH_ENCODED_API_KEY|Yes||The encoded API key for your user identity on your Elasticsearch cluster|
    |ELASTICSEARCH_INDEX|Yes||The name of your Elasticsearch index|
    |ELASTICSEARCH_QUERY_TYPE|No|simple|Can be one of `simple` or `vector`|
    |ELASTICSEARCH_EMBEDDING_MODEL_ID|Only if using vector search with an Elasticsearch embedding model||The name of the embedding model deployed to your Elasticsearch cluster which was used to produce embeddings for your index|
    |ELASTICSEARCH_TOP_K|No|5|The number of documents to retrieve when querying your search index.|
    |ELASTICSEARCH_ENABLE_IN_DOMAIN|No|True|Limits responses to only queries relating to your data.|
    |ELASTICSEARCH_STRICTNESS|No|3|Integer from 1 to 5 specifying the strictness for the model limiting responses to your data.|
    |ELASTICSEARCH_CONTENT_COLUMNS|No||List of fields in your search index that contains the text content of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
    |ELASTICSEARCH_FILENAME_COLUMN|No|| Field from your search index that gives a unique identifier of the source of your data to display in the UI.|
    |ELASTICSEARCH_TITLE_COLUMN|No||Field from your search index that gives a relevant title or header for your data content to display in the UI.|
    |ELASTICSEARCH_URL_COLUMN|No||Field from your search index that contains a URL for the document, e.g. an Azure Blob Storage URI. This value is not currently used.|
    |ELASTICSEARCH_VECTOR_COLUMNS|No||List of fields in your search index that contain vector embeddings of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|

    To use vector search with Elasticsearch, there are two options:

    1. To use Azure OpenAI embeddings, ensure that your index contains Azure OpenAI embeddings, and that the following variables are set:
    - `AZURE_OPENAI_EMBEDDING_NAME`: the name of your Ada (text-embedding-ada-002) model deployment on your Azure OpenAI resource, which was also used to create the embeddings in your index.
    - `ELASTICSEARCH_VECTOR_COLUMNS`: the vector columns in your index to use when searching. Join them with `|` like `contentVector|titleVector`.

    2. Use Elasticsearch embeddings, ensure that your index contains embeddings produced from a trained model on your Elasticsearch cluster, and that the following variables are set:
    - `ELASTICSEARCH_EMBEDDING_MODEL_ID`: the ID of the trained model used to produce embeddings on your index.
    - `ELASTICSEARCH_VECTOR_COLUMNS`: the vector columns in your index to use when searching. Join them with `|` like `contentVector|titleVector`.

#### Chat with your data using Pinecone (Private Preview)

1. Update the `AZURE_OPENAI_*` environment variables as described in the [basic chat experience](#basic-chat-experience) above. 

2. To connect to your data, you need to specify an Pinecone vector database configuration. Learn more about [Pinecone](https://www.pinecone.io/).

3. Configure data source settings as described in the table below.

    | App Setting | Required? | Default Value | Note |
    | --- | --- | --- | ------------- |
    |DATASOURCE_TYPE|Yes||Must be set to `Pinecone`|
    |PINECONE_ENVIRONMENT|Yes||The name of your Pinecone environment|
    |PINECONE_INDEX_NAME|Yes||The name of your Pinecone index|
    |PINECONE_API_KEY|Yes||The API key used to connect to your Pinecone instance|
    |PINECONE_TOP_K|No|5|The number of documents to retrieve when querying your search index.|
    |PINECONE_ENABLE_IN_DOMAIN|No|True|Limits responses to only queries relating to your data.|
    |PINECONE_STRICTNESS|No|3|Integer from 1 to 5 specifying the strictness for the model limiting responses to your data.|
    |PINECONE_CONTENT_COLUMNS|No||List of fields in your search index that contains the text content of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
    |PINECONE_FILENAME_COLUMN|No|| Field from your search index that gives a unique identifier of the source of your data to display in the UI.|
    |PINECONE_TITLE_COLUMN|No||Field from your search index that gives a relevant title or header for your data content to display in the UI.|
    |PINECONE_URL_COLUMN|No||Field from your search index that contains a URL for the document, e.g. an Azure Blob Storage URI. This value is not currently used.|
    |PINECONE_VECTOR_COLUMNS|No||List of fields in your search index that contain vector embeddings of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|

    Pinecone uses vector search by default, so ensure these settings are configured on your app:
    - `AZURE_OPENAI_EMBEDDING_NAME`: the name of your Ada (text-embedding-ada-002) model deployment on your Azure OpenAI resource.
    - `PINECONE_VECTOR_COLUMNS`: the vector columns in your index to use when searching. Join them with `|` like `contentVector|titleVector`.

#### Chat with your data using Mongo DB (Private Preview)

1. Update the `AZURE_OPENAI_*` environment variables as described in the [basic chat experience](#basic-chat-experience) above. 

2. To connect to your data, you need to specify an Mongo DB database configuration.  Learn more about [MongoDB](https://www.mongodb.com/).

3. Configure data source settings as described in the table below.

    | App Setting | Required? | Default Value | Note |
    | --- | --- | --- | ------------- |
    |DATASOURCE_TYPE|Yes||Must be set to `MongoDB`|
    |MONGODB_CONNECTION_STRING|Yes||The connection string used to connect to your Mongo DB instance|
    |MONGODB_VECTOR_INDEX|Yes||The name of your Mongo DB vector index|
    |MONGODB_DATABASE_NAME|Yes||The name of your Mongo DB database|
    |MONGODB_CONTAINER_NAME|Yes||The name of your Mongo DB container|
    |MONGODB_TOP_K|No|5|The number of documents to retrieve when querying your search index.|
    |MONGODB_ENABLE_IN_DOMAIN|No|True|Limits responses to only queries relating to your data.|
    |MONGODB_STRICTNESS|No|3|Integer from 1 to 5 specifying the strictness for the model limiting responses to your data.|
    |MONGODB_CONTENT_COLUMNS|No||List of fields in your search index that contains the text content of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
    |MONGODB_FILENAME_COLUMN|No|| Field from your search index that gives a unique identifier of the source of your data to display in the UI.|
    |MONGODB_TITLE_COLUMN|No||Field from your search index that gives a relevant title or header for your data content to display in the UI.|
    |MONGODB_URL_COLUMN|No||Field from your search index that contains a URL for the document, e.g. an Azure Blob Storage URI. This value is not currently used.|
    |MONGODB_VECTOR_COLUMNS|No||List of fields in your search index that contain vector embeddings of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|

    MongoDB uses vector search by default, so ensure these settings are configured on your app:
    - `AZURE_OPENAI_EMBEDDING_NAME`: the name of your Ada (text-embedding-ada-002) model deployment on your Azure OpenAI resource.
    - `MONGODB_VECTOR_COLUMNS`: the vector columns in your index to use when searching. Join them with `|` like `contentVector|titleVector`.
    
#### Chat with your data using Azure SQL Server (Private Preview)

1. Update the `AZURE_OPENAI_*` environment variables as described in the [basic chat experience](#basic-chat-experience) above. 

2. To enable Azure SQL Server, you will need to set up Azure SQL Server resources.  Refer to this [instruction guide](https://learn.microsoft.com/en-us/azure/azure-sql/database/single-database-create-quickstart) to create an Azure SQL database. 

3. Configure data source settings as described in the table below.

    | App Setting | Required? | Default Value | Note |
    | --- | --- | --- | ------------- |
    |DATASOURCE_TYPE|Yes||Must be set to `AzureSqlServer`|
    |AZURE_SQL_SERVER_CONNECTION_STRING|Yes||The connection string to use to connect to your Azure SQL Server instance|
    |AZURE_SQL_SERVER_TABLE_SCHEMA|Yes||The table schema for your Azure SQL Server table.  Must be surrounded by double quotes (`"`).|
    |AZURE_SQL_SERVER_PORT||Not publicly available at this time.|The port to use to connect to your Azure SQL Server instance.|
    |AZURE_SQL_SERVER_DATABASE_NAME||Not publicly available at this time.|
    |AZURE_SQL_SERVER_DATABASE_SERVER||Not publicly available at this time.|

#### Chat with your data using Promptflow

Configure your settings using the table below.

| App Setting | Required? | Default Value | Note |
| --- | --- | --- | ------------- |
|USE_PROMPTFLOW|No|False|Use existing Promptflow deployed endpoint. If set to `True` then both `PROMPTFLOW_ENDPOINT` and `PROMPTFLOW_API_KEY` also need to be set.|
|PROMPTFLOW_ENDPOINT|Only if `USE_PROMPTFLOW` is True||URL of the deployed Promptflow endpoint e.g. https://pf-deployment-name.region.inference.ml.azure.com/score|
|PROMPTFLOW_API_KEY|Only if `USE_PROMPTFLOW` is True||Auth key for deployed Promptflow endpoint. Note: only Key-based authentication is supported.|
|PROMPTFLOW_RESPONSE_TIMEOUT|No|120|Timeout value in seconds for the Promptflow endpoint to respond.|
|PROMPTFLOW_REQUEST_FIELD_NAME|No|query|Default field name to construct Promptflow request. Note: chat_history is auto constucted based on the interaction, if your API expects other mandatory field you will need to change the request parameters under `promptflow_request` function.|
|PROMPTFLOW_RESPONSE_FIELD_NAME|No|reply|Default field name to process the response from Promptflow request.|
|PROMPTFLOW_CITATIONS_FIELD_NAME|No|documents|Default field name to process the citations output from Promptflow request.|

#### Enable Chat History

1. Update the `AZURE_OPENAI_*` environment variables as described in the [basic chat experience](#basic-chat-experience) above.

2. Add any additional configuration (described in previous sections) needed for chatting with data, if required.

3. To enable chat history, you will need to set up CosmosDB resources. The ARM template in the `infrastructure` folder can be used to deploy an app service and a CosmosDB with the database and container configured.

4. Configure data source settings as described in the table below.

    | App Setting | Required? | Default Value | Note |
    | --- | --- | --- | ------------- |
    |AZURE_COSMOSDB_ACCOUNT|Only if using chat history||The name of the Azure Cosmos DB account used for storing chat history|
    |AZURE_COSMOSDB_DATABASE|Only if using chat history||The name of the Azure Cosmos DB database used for storing chat history|
    |AZURE_COSMOSDB_CONVERSATIONS_CONTAINER|Only if using chat history||The name of the Azure Cosmos DB container used for storing chat history|
    |AZURE_COSMOSDB_ACCOUNT_KEY|Only if using chat history||The account key for the Azure Cosmos DB account used for storing chat history|
    |AZURE_COSMOSDB_ENABLE_FEEDBACK|No|False|Whether or not to enable message feedback on chat history messages|


#### Enable Azure OpenAI function calling via Azure Functions

Refer to this article to learn more about [function calling with Azure OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/function-calling).

1. Update the `AZURE_OPENAI_*` environment variables as described in the [basic chat experience](#basic-chat-experience) above.

2. Add any additional configuration (described in previous sections) needed for chatting with data, if required.

3. To enable function calling via remote Azure Functions, you will need to set up an Azure Function resource. Refer to this [instruction guide](https://learn.microsoft.com/azure/azure-functions/functions-create-function-app-portal?pivots=programming-language-python) to create an Azure Function resource.

4. You will need to create the following Azure Functions to implement function calling logic:

    * Create one function with routing, e.g. /tools, that will return a JSON array with the function definitions.
    * Create a second function with routing, e.g. /tool, that will execute the functions with the given arguments.
    The request body will be a JSON structure with the function name and arguments of the function to be executed.   
    Use this sample as function request body to test your function call:

        ```
        {
            "tool_name" : "get_current_weather",
            "tool_arguments" : {"location":"Lamego"}
        }
        ```

    * Create functions without routing to implement all the functions defined in the JSON definition.
    
    Sample code for the Azure Functions:

    ```
    import azure.functions as func
    import logging
    import json
    import random

    app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

    azure_openai_tools_json = """[{
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city name, e.g. San Francisco"
                    }
                },
                "required": ["location"]
            }
        }
    }]"""

    azure_openai_available_tools = ["get_current_weather"]

    @app.route(route="tools")
    def tools(req: func.HttpRequest) -> func.HttpResponse:
        logging.info('tools function processed a request.')

        return func.HttpResponse(
            azure_openai_tools_json,
            status_code=200
        )

    @app.route(route="tool")
    def tool(req: func.HttpRequest) -> func.HttpResponse:
        logging.info('tool function processed a request.')

        tool_name = req.params.get('tool_name')
        if not tool_name:
            try:
                req_body = req.get_json()
            except ValueError:
                pass
            else:
                tool_name = req_body.get('tool_name')

        tool_arguments = req.params.get('tool_arguments')
        if not tool_arguments:
            try:
                req_body = req.get_json()
            except ValueError:
                pass
            else:
                tool_arguments = req_body.get('tool_arguments')

        if tool_name and tool_arguments:
            if tool_name in azure_openai_available_tools:
                logging.info('tool function: tool_name and tool_arguments are valid.')
                result = globals()[tool_name](**tool_arguments)
                return func.HttpResponse(
                    result,
                    status_code = 200
                )

        logging.info('tool function: tool_name or tool_arguments are invalid.')
        return func.HttpResponse(
                "The tool function we executed successfully but the tool name or arguments were invalid. ",
                status_code=400
        )

    def get_current_weather(location: str) -> str:
        logging.info('get_current_weather function processed a request.')
        temperature = random.randint(10, 30)
        weather = random.choice(["sunny", "cloudy", "rainy", "windy"])
        return f"The current weather in {location} is {temperature}°C and {weather}."
    ```

4. Configure data source settings as described in the table below:

    | App Setting | Required? | Default Value | Note |
    | ----------- | --------- | ------------- | ---- |
    | AZURE_OPENAI_FUNCTION_CALL_AZURE_FUNCTIONS_ENABLED | No |  |  |
    | AZURE_OPENAI_FUNCTION_CALL_AZURE_FUNCTIONS_TOOL_BASE_URL | Only if using function calling |  | The base URL of your Azure Function "tool", e.g. [https://<azure-function-name>.azurewebsites.net/api/tool]() |
    | AZURE_OPENAI_FUNCTION_CALL_AZURE_FUNCTIONS_TOOL_KEY | Only if using function calling |  | The function key used to access the Azure Function "tool" |
    | AZURE_OPENAI_FUNCTION_CALL_AZURE_FUNCTIONS_TOOLS_BASE_URL | Only if using function calling |  | The base URL of your Azure Function "tools", e.g. [https://<azure-function-name>.azurewebsites.net/api/tools]() |
    | AZURE_OPENAI_FUNCTION_CALL_AZURE_FUNCTIONS_TOOLS_KEY | Only if using function calling |  | The function key used to access the Azure Function "tools" |


#### Common Customization Scenarios (e.g. updating the default chat logo and headers)

The interface allows for easy adaptation of the UI by modifying certain elements, such as the title and logo, through the use of the following environment variables.

| App Setting | Required? | Default Value | Note |
|---|---|---|---|
|UI_TITLE|No|Contoso| Chat title (left-top) and page title (HTML)
|UI_LOGO|No|| Logo (left-top). Defaults to Contoso logo. Configure the URL to your logo image to modify.
|UI_CHAT_LOGO|No|| Logo (chat window). Defaults to Contoso logo. Configure the URL to your logo image to modify.
|UI_CHAT_TITLE|No|Start chatting| Title (chat window)
|UI_CHAT_DESCRIPTION|No|This chatbot is configured to answer your questions| Description (chat window)
|UI_FAVICON|No|| Defaults to Contoso favicon. Configure the URL to your favicon to modify.
|UI_SHOW_SHARE_BUTTON|No|True|Share button (right-top)
|UI_SHOW_CHAT_HISTORY_BUTTON|No|True|Show chat history button (right-top)
|SANITIZE_ANSWER|No|False|Whether to sanitize the answer from Azure OpenAI. Set to True to remove any HTML tags from the response.|

Any custom images assigned to variables `UI_LOGO`, `UI_CHAT_LOGO` or `UI_FAVICON` should be added to the [public](https://github.com/microsoft/sample-app-aoai-chatGPT/tree/main/frontend/public) folder before building the project. The Vite build process will automatically copy theses files to the [static](https://github.com/microsoft/sample-app-aoai-chatGPT/tree/main/static) folder on each build of the frontend. The corresponding environment variables should then be set using a relative path such as `static/<my image filename>` to ensure that the frontend code can find them.

Feel free to fork this repository and make your own modifications to the UX or backend logic. You can modify the source (`frontend/src`). For example, you may want to change aspects of the chat display, or expose some of the settings in `app.py` in the UI for users to try out different behaviors. After your code changes, you will need to rebuild the front-end via `start.sh` or `start.cmd`.

### Scalability
You can configure the number of threads and workers in `gunicorn.conf.py`. After making a change, redeploy your app using the commands listed above.

See the [Oryx documentation](https://github.com/microsoft/Oryx/blob/main/doc/configuration.md) for more details on these settings.

### Debugging your deployed app
First, add an environment variable on the app service resource called "DEBUG". Set this to "true".

Next, enable logging on the app service. Go to "App Service logs" under Monitoring, and change Application logging to File System. Save the change.

Now, you should be able to see logs from your app by viewing "Log stream" under Monitoring.

### Changing Citation Display
The Citation panel is defined at the end of `frontend/src/pages/chat/Chat.tsx`. The citations returned from Azure OpenAI On Your Data will include `content`, `title`, `filepath`, and in some cases `url`. You can customize the Citation section to use and display these as you like. For example, the title element is a clickable hyperlink if `url` is not a blob URL.

```
    <h5 
        className={styles.citationPanelTitle} 
        tabIndex={0} 
        title={activeCitation.url && !activeCitation.url.includes("blob.core") ? activeCitation.url : activeCitation.title ?? ""} 
        onClick={() => onViewSource(activeCitation)}
    >{activeCitation.title}</h5>

    const onViewSource = (citation: Citation) => {
        if (citation.url && !citation.url.includes("blob.core")) {
            window.open(citation.url, "_blank");
        }
    };

```

## Best Practices
We recommend keeping these best practices in mind:

- Reset the chat session (clear chat) if the user changes any settings. Notify the user that their chat history will be lost.
- Clearly communicate to the user what impact each setting will have on their experience.
- When you rotate API keys for your AOAI or ACS resource, be sure to update the app settings for each of your deployed apps to use the new key.
- Pull in changes from `main` frequently to ensure you have the latest bug fixes and improvements, especially when using Azure OpenAI on your data.

**A note on Azure OpenAI API versions**: The application code in this repo will implement the request and response contracts for the most recent preview API version supported for Azure OpenAI.  To keep your application up-to-date as the Azure OpenAI API evolves with time, be sure to merge the latest API version update into your own application code and redeploy using the methods described in this document.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

When contributing to this repository, please help keep the codebase clean and maintainable by running 
the formatter and linter with `npm run format` this will run `npx eslint --fix` and `npx prettier --write` 
on the frontebnd codebase. 

If you are using VSCode, you can add the following settings to your `settings.json` to format and lint on save:

```json
{
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
    },
    "editor.formatOnSave": true,
    "prettier.requireConfig": true,
}
```

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
