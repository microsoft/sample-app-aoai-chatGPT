# [Preview] Sample Chat App with AOAI

This repo contains sample code for a simple chat webapp that integrates with Azure OpenAI. Note: some portions of the app use preview APIs.

## Prerequisites
- An existing Azure OpenAI resource and model deployment of a chat model (e.g. `gpt-35-turbo-16k`, `gpt-4`)
- To use Azure OpenAI on your data: one of the following data sources:
  - Azure AI Search Index
  - Azure CosmosDB Mongo vCore vector index
  - Elasticsearch index (preview)
  - Pinecone index (preview)
  - AzureML index (preview)

## Deploy the app

### Deploy with Azure Developer CLI
Please see [README_azd.md](./README_azd.md) for detailed instructions.

### One click Azure deployment
[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmicrosoft%2Fsample-app-aoai-chatGPT%2Fmain%2Finfrastructure%2Fdeployment.json)

Click on the Deploy to Azure button and configure your settings in the Azure Portal as described in the [Environment variables](#environment-variables) section.

Please see the [section below](#add-an-identity-provider) for important information about adding authentication to your app.

### Deploy from your local machine

#### Local Setup: Basic Chat Experience
1. Copy `.env.sample` to a new file called `.env` and configure the settings as described in the [Environment variables](#environment-variables) section.
    
    These variables are required:
    - `AZURE_OPENAI_RESOURCE`
    - `AZURE_OPENAI_MODEL`
    - `AZURE_OPENAI_KEY`

    These variables are optional:
    - `AZURE_OPENAI_TEMPERATURE`
    - `AZURE_OPENAI_TOP_P`
    - `AZURE_OPENAI_MAX_TOKENS`
    - `AZURE_OPENAI_STOP_SEQUENCE`
    - `AZURE_OPENAI_SYSTEM_MESSAGE`

    See the [documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/reference#example-response-2) for more information on these parameters.

2. Start the app with `start.cmd`. This will build the frontend, install backend dependencies, and then start the app. Or, just run the backend in debug mode using the VSCode debug configuration in `.vscode/launch.json`.

3. You can see the local running app at http://127.0.0.1:50505.

#### Local Setup: Chat with your data (Preview)
[More information about Azure OpenAI on your data](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/concepts/use-your-data)

1. Update the `AZURE_OPENAI_*` environment variables as described above. 
2. To connect to your data, you need to specify an Azure Cognitive Search index to use. You can [create this index yourself](https://learn.microsoft.com/en-us/azure/search/search-get-started-portal) or use the [Azure AI Studio](https://oai.azure.com/portal/chat) to create the index for you.

    These variables are required when adding your data with Azure AI Search:
    - `AZURE_SEARCH_SERVICE`
    - `AZURE_SEARCH_INDEX`
    - `AZURE_SEARCH_KEY`

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

#### Deploy with the Azure CLI
**NOTE**: If you've made code changes, be sure to **build the app code** with `start.cmd` or `start.sh` before you deploy, otherwise your changes will not be picked up. If you've updated any files in the `frontend` folder, make sure you see updates to the files in the `static` folder before you deploy.

You can use the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) to deploy the app from your local machine. Make sure you have version 2.48.1 or later.

If this is your first time deploying the app, you can use [az webapp up](https://learn.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-up). Run the following two commands from the root folder of the repo, updating the placeholder values to your desired app name, resource group, location, and subscription. You can also change the SKU if desired.

1. `az webapp up --runtime PYTHON:3.11 --sku B1 --name <new-app-name> --resource-group <resource-group-name> --location <azure-region> --subscription <subscription-name>`
1. `az webapp config set --startup-file "python3 -m gunicorn app:app" --name <new-app-name>`

If you've deployed the app previously, first run this command to update the appsettings to allow local code deployment:

`az webapp config appsettings set -g <resource-group-name> -n <existing-app-name> --settings WEBSITE_WEBDEPLOY_USE_SCM=false`

Check the runtime stack for your app by viewing the app service resource in the Azure Portal. If it shows "Python - 3.10", use `PYTHON:3.10` in the runtime argument below. If it shows "Python - 3.11", use `PYTHON:3.11` in the runtime argument below. 

Check the SKU in the same way. Use the abbreviated SKU name in the argument below, e.g. for "Basic (B1)" the SKU is `B1`. 

Then, use these commands to deploy your local code to the existing app:

1. `az webapp up --runtime <runtime-stack> --sku <sku> --name <existing-app-name> --resource-group <resource-group-name>`
1. `az webapp config set --startup-file "python3 -m gunicorn app:app" --name <existing-app-name>`

Make sure that the app name and resource group match exactly for the app that was previously deployed.

Deployment will take several minutes. When it completes, you should be able to navigate to your app at {app-name}.azurewebsites.net.

### Add an identity provider
After deployment, you will need to add an identity provider to provide authentication support in your app. See [this tutorial](https://learn.microsoft.com/en-us/azure/app-service/scenario-secure-app-authentication-app-service) for more information.

If you don't add an identity provider, the chat functionality of your app will be blocked to prevent unauthorized access to your resources and data. 

To remove this restriction, you can add `AUTH_ENABLED=False` to the environment variables. This will disable authentication and allow anyone to access the chat functionality of your app. **This is not recommended for production apps.**

To add further access controls, update the logic in `getUserInfoList` in `frontend/src/pages/chat/Chat.tsx`. 

### Common Customization Scenarios (e.g. updating the default chat logo and headers)

The interface allows for easy adaptation of the UI by modifying certain elements, such as the title and logo, through the use of [environment variables](#environment-variables).

- `UI_TITLE`
- `UI_LOGO`
- `UI_CHAT_TITLE`
- `UI_CHAT_LOGO`
- `UI_CHAT_DESCRIPTION`
- `UI_FAVICON`
- `UI_SHOW_SHARE_BUTTON`

Feel free to fork this repository and make your own modifications to the UX or backend logic. You can modify the source (`frontend/src`). For example, you may want to change aspects of the chat display, or expose some of the settings in `app.py` in the UI for users to try out different behaviors. After your code changes, you will need to rebuild the front-end via `start.sh` or `start.cmd`.

### Scalability
You can configure the number of threads and workers in `gunicorn.conf.py`. After making a change, redeploy your app using the commands listed above.

See the [Oryx documentation](https://github.com/microsoft/Oryx/blob/main/doc/configuration.md) for more details on these settings.

### Debugging your deployed app
First, add an environment variable on the app service resource called "DEBUG". Set this to "true".

Next, enable logging on the app service. Go to "App Service logs" under Monitoring, and change Application logging to File System. Save the change.

Now, you should be able to see logs from your app by viewing "Log stream" under Monitoring.

### Configuring vector search
When using your own data with a vector index, ensure these settings are configured on your app:
- `AZURE_SEARCH_QUERY_TYPE`: can be `vector`, `vectorSimpleHybrid`, or `vectorSemanticHybrid`,
- `AZURE_OPENAI_EMBEDDING_NAME`: the name of your Ada (text-embedding-ada-002) model deployment on your Azure OpenAI resource.
- `AZURE_SEARCH_VECTOR_COLUMNS`: the vector columns in your index to use when searching. Join them with `|` like `contentVector|titleVector`.

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


### Best Practices
We recommend keeping these best practices in mind:

- Reset the chat session (clear chat) if the user changes any settings. Notify the user that their chat history will be lost.
- Clearly communicate to the user what impact each setting will have on their experience.
- When you rotate API keys for your AOAI or ACS resource, be sure to update the app settings for each of your deployed apps to use the new key.
- Pull in changes from `main` frequently to ensure you have the latest bug fixes and improvements, especially when using Azure OpenAI on your data.

**A note on Azure OpenAI API versions**: The application code in this repo will implement the request and response contracts for the most recent preview API version supported for Azure OpenAI.  To keep your application up-to-date as the Azure OpenAI API evolves with time, be sure to merge the latest API version update into your own application code and redeploy using the methods described in this document.

## Environment variables

Note: settings starting with `AZURE_SEARCH` are only needed when using Azure OpenAI on your data with Azure AI Search. If not connecting to your data, you only need to specify `AZURE_OPENAI` settings.

| App Setting | Value | Note |
| --- | --- | ------------- |
|AZURE_SEARCH_SERVICE||The name of your Azure AI Search resource|
|AZURE_SEARCH_INDEX||The name of your Azure AI Search Index|
|AZURE_SEARCH_KEY||An **admin key** for your Azure AI Search resource|
|AZURE_SEARCH_USE_SEMANTIC_SEARCH|False|Whether or not to use semantic search|
|AZURE_SEARCH_QUERY_TYPE|simple|Query type: simple, semantic, vector, vectorSimpleHybrid, or vectorSemanticHybrid. Takes precedence over AZURE_SEARCH_USE_SEMANTIC_SEARCH|
|AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG||The name of the semantic search configuration to use if using semantic search.|
|AZURE_SEARCH_TOP_K|5|The number of documents to retrieve from Azure AI Search.|
|AZURE_SEARCH_ENABLE_IN_DOMAIN|True|Limits responses to only queries relating to your data.|
|AZURE_SEARCH_CONTENT_COLUMNS||List of fields in your Azure AI Search index that contains the text content of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
|AZURE_SEARCH_FILENAME_COLUMN|| Field from your Azure AI Search index that gives a unique idenitfier of the source of your data to display in the UI.|
|AZURE_SEARCH_TITLE_COLUMN||Field from your Azure AI Search index that gives a relevant title or header for your data content to display in the UI.|
|AZURE_SEARCH_URL_COLUMN||Field from your Azure AI Search index that contains a URL for the document, e.g. an Azure Blob Storage URI. This value is not currently used.|
|AZURE_SEARCH_VECTOR_COLUMNS||List of fields in your Azure AI Search index that contain vector embeddings of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`|
|AZURE_SEARCH_PERMITTED_GROUPS_COLUMN||Field from your Azure AI Search index that contains AAD group IDs that determine document-level access control.|
|AZURE_SEARCH_STRICTNESS|3|Integer from 1 to 5 specifying the strictness for the model limiting responses to your data.|
|AZURE_OPENAI_RESOURCE||the name of your Azure OpenAI resource|
|AZURE_OPENAI_MODEL||The name of your model deployment|
|AZURE_OPENAI_ENDPOINT||The endpoint of your Azure OpenAI resource.|
|AZURE_OPENAI_MODEL_NAME|gpt-35-turbo-16k|The name of the model|
|AZURE_OPENAI_KEY||One of the API keys of your Azure OpenAI resource|
|AZURE_OPENAI_TEMPERATURE|0|What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. A value of 0 is recommended when using your data.|
|AZURE_OPENAI_TOP_P|1.0|An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. We recommend setting this to 1.0 when using your data.|
|AZURE_OPENAI_MAX_TOKENS|1000|The maximum number of tokens allowed for the generated answer.|
|AZURE_OPENAI_STOP_SEQUENCE||Up to 4 sequences where the API will stop generating further tokens. Represent these as a string joined with "|", e.g. `"stop1|stop2|stop3"`|
|AZURE_OPENAI_SYSTEM_MESSAGE|You are an AI assistant that helps people find information.|A brief description of the role and tone the model should use|
|AZURE_OPENAI_PREVIEW_API_VERSION|2024-02-15-preview|API version when using Azure OpenAI on your data|
|AZURE_OPENAI_STREAM|True|Whether or not to use streaming for the response|
|AZURE_OPENAI_EMBEDDING_NAME||The name of your embedding model deployment if using vector search.
|UI_TITLE|Contoso| Chat title (left-top) and page title (HTML)
|UI_LOGO|| Logo (left-top). Defaults to Contoso logo. Configure the URL to your logo image to modify.
|UI_CHAT_LOGO|| Logo (chat window). Defaults to Contoso logo. Configure the URL to your logo image to modify.
|UI_CHAT_TITLE|Start chatting| Title (chat window)
|UI_CHAT_DESCRIPTION|This chatbot is configured to answer your questions| Description (chat window)
|UI_FAVICON|| Defaults to Contoso favicon. Configure the URL to your favicon to modify.
|UI_SHOW_SHARE_BUTTON|True|Share button (right-top)
|SANITIZE_ANSWER|False|Whether to sanitize the answer from Azure OpenAI. Set to True to remove any HTML tags from the response.|
|USE_PROMPTFLOW|False|Use existing Promptflow deployed endpoint. If set to `True` then both `PROMPTFLOW_ENDPOINT` and `PROMPTFLOW_API_KEY` also need to be set.|
|PROMPTFLOW_ENDPOINT||URL of the deployed Promptflow endpoint e.g. https://pf-deployment-name.region.inference.ml.azure.com/score|
|PROMPTFLOW_API_KEY||Auth key for deployed Promptflow endpoint. Note: only Key-based authentication is supported.|
|PROMPTFLOW_RESPONSE_TIMEOUT|120|Timeout value in seconds for the Promptflow endpoint to respond.|
|PROMPTFLOW_REQUEST_FIELD_NAME|question|Default field name to construct Promptflow request. Note: chat_history is auto constucted based on the interaction, if your API expects other mandatory field you will need to change the request parameters under `promptflow_request` function.|
|PROMPTFLOW_RESPONSE_FIELD_NAME|answer|Default field name to process the response from Promptflow request.|

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

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
