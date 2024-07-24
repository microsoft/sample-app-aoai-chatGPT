# [Preview] UUFSolver

This app is built on the Sample Chat App with AOAI GitHub project from which it is forked. It modifies Chat.tsx to add URL parsing, so it will automatically start the conversation with **Article** and **Feedback** parameters that represent the URL of a [Learn](https://learn.microsoft.com) article, and its associated feedback. It then gives its best suggestion to resolve/address the feedback, with reference links to validate ground truth on its claims. It will also accept raw text pasted from a UUF feedback item description, which contains **Live URL** and **Verbatim** fields, and do the same with them.

Note: some portions of the app use preview APIs.

## Prerequisites
- An existing Azure OpenAI resource and model deployment of a chat model (e.g. `gpt-35-turbo-16k`, `gpt-4`)
- To use Azure OpenAI on your data: one of the following data sources:
  - Azure AI Search Index
  - Azure CosmosDB Mongo vCore vector index
  - Elasticsearch index (preview)
  - Pinecone index (preview)
  - AzureML index (preview)

## Deploy the app

### Deploy from your local machine

#### Local Setup: Basic Chat Experience
1. Copy `.env.sample` to a new file called `.env` and configure the settings as described in the [Environment variables](#environment-variables) section.
    
    These variables are required:
    - `AZURE_OPENAI_RESOURCE` or `AZURE_OPENAI_ENDPOINT`
    - `AZURE_OPENAI_MODEL`
    - `AZURE_OPENAI_KEY` (optional if using Entra ID)

    These variables are optional:
    - `AZURE_OPENAI_TEMPERATURE`
    - `AZURE_OPENAI_TOP_P`
    - `AZURE_OPENAI_MAX_TOKENS`
    - `AZURE_OPENAI_STOP_SEQUENCE`
    - `AZURE_OPENAI_SYSTEM_MESSAGE`

    See the [documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/reference#example-response-2) for more information on these parameters.

2. Start the app with `start.cmd`. This will build the frontend, install backend dependencies, and then start the app. Or, just run the backend in debug mode using the VSCode debug configuration in `.vscode/launch.json`.

3. You can see the local running app at http://127.0.0.1:50505.

NOTE: You may find you need to set: MacOS: `export NODE_OPTIONS="--max-old-space-size=8192"` or Windows: `set NODE_OPTIONS=--max-old-space-size=8192` to avoid running out of memory when building the frontend.

#### Local Setup: Chat with your data using Azure Cognitive Search
[More information about Azure OpenAI on your data](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/concepts/use-your-data)

1. Update the `AZURE_OPENAI_*` environment variables as described above. 
2. To connect to your data, you need to specify an Azure Cognitive Search index to use. You can [create this index yourself](https://learn.microsoft.com/en-us/azure/search/search-get-started-portal) or use the [Azure AI Studio](https://oai.azure.com/portal/chat) to create the index for you.

    These variables are required when adding your data with Azure AI Search:
    - `DATASOURCE_TYPE` (should be set to `AzureCognitiveSearch`)
    - `AZURE_SEARCH_SERVICE`
    - `AZURE_SEARCH_INDEX`
    - `AZURE_SEARCH_KEY` (optional if using Entra ID)

    These variables are optional:
    - `AZURE_SEARCH_USE_SEMANTIC_SEARCH`
    - `AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG`
    - `AZURE_SEARCH_INDEX_TOP_K`
    - `AZURE_SEARCH_ENABLE_IN_DOMAIN`
    - `AZURE_SEARCH_CONTENT_COLUMNS`
    - `AZURE_SEARCH_FILENAME_COLUMN`
    - `AZURE_SEARCH_TITLE_COLUMN`
    - `AZURE_SEARCH_URL_COLUMN`
    - `AZURE_SEARCH_VECTOR_COLUMNS`
    - `AZURE_SEARCH_QUERY_TYPE`
    - `AZURE_SEARCH_PERMITTED_GROUPS_COLUMN`
    - `AZURE_SEARCH_STRICTNESS`
    - `AZURE_OPENAI_EMBEDDING_NAME`

3. Start the app with `start.cmd`. This will build the frontend, install backend dependencies, and then start the app. Or, just run the backend in debug mode using the VSCode debug configuration in `.vscode/launch.json`.
4. You can see the local running app at http://127.0.0.1:50505.

NOTE: You may find you need to set: MacOS: `export NODE_OPTIONS="--max-old-space-size=8192"` or Windows: `set NODE_OPTIONS=--max-old-space-size=8192` to avoid running out of memory when building the frontend.

#### Local Setup: Enable Chat History
To enable chat history, you will need to set up CosmosDB resources. The ARM template in the `infrastructure` folder can be used to deploy an app service and a CosmosDB with the database and container configured. Then specify these additional environment variables: 
- `AZURE_COSMOSDB_ACCOUNT`
- `AZURE_COSMOSDB_DATABASE`
- `AZURE_COSMOSDB_CONVERSATIONS_CONTAINER`
- `AZURE_COSMOSDB_ACCOUNT_KEY`

As above, start the app with `start.cmd`, then visit the local running app at http://127.0.0.1:50505. Or, just run the backend in debug mode using the VSCode debug configuration in `.vscode/launch.json`.

#### Local Setup: Enable Message Feedback
To enable message feedback, you will need to set up CosmosDB resources. Then specify these additional environment variable:

/.env
- `AZURE_COSMOSDB_ENABLE_FEEDBACK=True`

## Environment variables

Note: settings starting with `AZURE_SEARCH` are only needed when using Azure OpenAI on your data with Azure AI Search. If not connecting to your data, you only need to specify `AZURE_OPENAI` settings.

| App Setting | Value | Note |
| --- | --- | ------------- |
|AZURE_SEARCH_SERVICE||The name of your Azure AI Search resource|
|AZURE_SEARCH_INDEX||The name of your Azure AI Search Index|
|AZURE_SEARCH_KEY||An **admin key** for your Azure AI Search resource.|
|AZURE_SEARCH_USE_SEMANTIC_SEARCH|False|Whether or not to use semantic search|
|AZURE_SEARCH_QUERY_TYPE|simple|Query type: simple, semantic, vector, vectorSimpleHybrid, or vectorSemanticHybrid. Takes precedence over AZURE_SEARCH_USE_SEMANTIC_SEARCH|
|AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG||The name of the semantic search configuration to use if using semantic search.|
|AZURE_SEARCH_TOP_K|5|The number of documents to retrieve from Azure AI Search.|
|AZURE_SEARCH_ENABLE_IN_DOMAIN|True|Limits responses to only queries relating to your data.|
|AZURE_SEARCH_CONTENT_COLUMNS||List of fields in your Azure AI Search index that contains the text content of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
|AZURE_SEARCH_FILENAME_COLUMN|| Field from your Azure AI Search index that gives a unique identifier of the source of your data to display in the UI.|
|AZURE_SEARCH_TITLE_COLUMN||Field from your Azure AI Search index that gives a relevant title or header for your data content to display in the UI.|
|AZURE_SEARCH_URL_COLUMN||Field from your Azure AI Search index that contains a URL for the document, e.g. an Azure Blob Storage URI. This value is not currently used.|
|AZURE_SEARCH_VECTOR_COLUMNS||List of fields in your Azure AI Search index that contain vector embeddings of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
|AZURE_SEARCH_PERMITTED_GROUPS_COLUMN||Field from your Azure AI Search index that contains AAD group IDs that determine document-level access control.|
|AZURE_SEARCH_STRICTNESS|3|Integer from 1 to 5 specifying the strictness for the model limiting responses to your data.|
|AZURE_OPENAI_RESOURCE||the name of your Azure OpenAI resource (only one of AZURE_OPENAI_RESOURCE/AZURE_OPENAI_ENDPOINT is required)|
|AZURE_OPENAI_MODEL||The name of your model deployment|
|AZURE_OPENAI_ENDPOINT||The endpoint of your Azure OpenAI resource (only one of AZURE_OPENAI_RESOURCE/AZURE_OPENAI_ENDPOINT is required)|
|AZURE_OPENAI_MODEL_NAME|gpt-35-turbo-16k|The name of the model|
|AZURE_OPENAI_KEY||One of the API keys of your Azure OpenAI resource (optional if using Entra ID)|
|AZURE_OPENAI_TEMPERATURE|0|What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. A value of 0 is recommended when using your data.|
|AZURE_OPENAI_TOP_P|1.0|An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. We recommend setting this to 1.0 when using your data.|
|AZURE_OPENAI_MAX_TOKENS|1000|The maximum number of tokens allowed for the generated answer.|
|AZURE_OPENAI_STOP_SEQUENCE||Up to 4 sequences where the API will stop generating further tokens. Represent these as a string joined with "|", e.g. `"stop1|stop2|stop3"`|
|AZURE_OPENAI_SYSTEM_MESSAGE|You are an AI assistant that helps people find information.|A brief description of the role and tone the model should use|
|AZURE_OPENAI_PREVIEW_API_VERSION|2024-02-15-preview|API version when using Azure OpenAI on your data|
|AZURE_OPENAI_STREAM|True|Whether or not to use streaming for the response. Note: Setting this to true prevents the use of prompt flow.|
|AZURE_OPENAI_EMBEDDING_NAME||The name of your embedding model deployment if using vector search.
|UI_TITLE|Contoso| Chat title (left-top) and page title (HTML)
|UI_LOGO|| Logo (left-top). Defaults to Contoso logo. Configure the URL to your logo image to modify.
|UI_CHAT_LOGO|| Logo (chat window). Defaults to Contoso logo. Configure the URL to your logo image to modify.
|UI_CHAT_TITLE|Start chatting| Title (chat window)
|UI_CHAT_DESCRIPTION|This chatbot is configured to answer your questions| Description (chat window)
|UI_FAVICON|| Defaults to Contoso favicon. Configure the URL to your favicon to modify.
|UI_SHOW_SHARE_BUTTON|True|Share button (right-top)
|UI_SHOW_CHAT_HISTORY_BUTTON|True|Show chat history button (right-top)
|SANITIZE_ANSWER|False|Whether to sanitize the answer from Azure OpenAI. Set to True to remove any HTML tags from the response.|
|USE_PROMPTFLOW|False|Use existing Promptflow deployed endpoint. If set to `True` then both `PROMPTFLOW_ENDPOINT` and `PROMPTFLOW_API_KEY` also need to be set.|
|PROMPTFLOW_ENDPOINT||URL of the deployed Promptflow endpoint e.g. https://pf-deployment-name.region.inference.ml.azure.com/score|
|PROMPTFLOW_API_KEY||Auth key for deployed Promptflow endpoint. Note: only Key-based authentication is supported.|
|PROMPTFLOW_RESPONSE_TIMEOUT|120|Timeout value in seconds for the Promptflow endpoint to respond.|
|PROMPTFLOW_REQUEST_FIELD_NAME|query|Default field name to construct Promptflow request. Note: chat_history is auto constucted based on the interaction, if your API expects other mandatory field you will need to change the request parameters under `promptflow_request` function.|
|PROMPTFLOW_RESPONSE_FIELD_NAME|reply|Default field name to process the response from Promptflow request.|
|PROMPTFLOW_CITATIONS_FIELD_NAME|documents|Default field name to process the citations output from Promptflow request.|
|DATASOURCE_TYPE||Type of data source to use for using the 'on-your-data' api. Can be `AzureCognitiveSearch`, `AzureCosmosDB`, `Elasticsearch`, `Pinecone`, `AzureMLIndex`, `AzureSqlServer` or `None` |

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
