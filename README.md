# [Preview] Sample Chat App with AOAI

This repo contains sample code for a simple chat webapp that integrates with Azure OpenAI. Some portions of the app use preview APIs and features that should not be used for any production dependency.

## Run the app

### Basic Chat Experience
1. Update the environment variables listed in `app.py`. 
    
    These variables are required:
    - `AZURE_OPENAI_RESOURCE`: the name of your Azure OpenAI resource
    - `AZURE_OPENAI_MODEL`: the name of your Azure OpenAI model deployment
    - `AZURE_OPENAI_KEY`: one of the API keys of your Azure OpenAI resource

    These variables are optional:
    - `AZURE_OPENAI_TEMPERATURE`: What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.\nWe generally recommend altering this or top_p but not both.
    - `AZURE_OPENAI_TOP_P`: An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. We generally recommend altering this or temperature but not both.
    - `AZURE_OPENAI_MAX_TOKENS`: The maximum number of tokens allowed for the generated answer.
    - `AZURE_OPENAI_STOP_SEQUENCE`: Up to 4 sequences where the API will stop generating further tokens. Represent these as a string joined with "|", e.g. `"stop1|stop2|stop3"`.
    - `AZURE_OPENAI_SYSTEM_MESSAGE`: A brief description of the role and tone the model should use, e.g. "You are an AI assistant that helps people find information."

    See the [documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/reference#example-response-2) for more information on these parameters.

2. Start the app with `start.cmd`. This will build the frontend, install backend dependencies, and then start the app.

3. You can see the local running app at http://127.0.0.1:5000.

### Chat with your data
1. Update the `AZURE_OPENAI_*` environment variables as described above. 
2. To connect to your data, you need to specify an Azure Cognitive Search index to use. You can [create this index yourself](https://learn.microsoft.com/en-us/azure/search/search-get-started-portal) or use the [Azure AI Studio](https://oai.azure.com/portal/chat) to create the index for you.

    These variables are required when adding your data:
    - `AZURE_SEARCH_SERVICE`: the name of your Azure Cognitive Search resource
    - `AZURE_SEARCH_INDEX`: the name of your Azure Cognitive Search Index.
    - `AZURE_SEARCH_KEY`: an **admin key** for your Azure Cognitive Search resource.

    These variables are optional:
    - `AZURE_SEARCH_USE_SEMANTIC_SEARCH`: Whether or not to use semantic search
    - `AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG`: The name of the semantic search configuration to use if using semantic search.
    - `AZURE_SEARCH_INDEX_TOP_K`: The number of documents to retrieve from Azure Cognitive Search.
    - `AZURE_SEARCH_ENABLE_IN_DOMAIN`: Limits responses to only queries relating to your data.
    - `AZURE_SEARCH_CONTENT_COLUMNS`: List of fields in your Azure Cognitive Search index that contains the text content of your documents to use when formulating a bot response. Represent these as a string joined with "|", e.g. `"product_description|product_manual"`
    - `AZURE_SEARCH_FILENAME_COLUMN`: Field from your Azure Cognitive Search index that gives a unique idenitfier of the source of your data to display in the UI.
    - `AZURE_SEARCH_TITLE_COLUMN`: Field from your Azure Cognitive Search index that gives a relevant title or header for your data content to display in the UI.
    - `AZURE_SEARCH_URL_COLUMN`: Field from your Azure Cognitive Search index that contains a URL for the document, e.g. an Azure Blob Storage URI. This value is not currently used.
3. Start the app with `start.cmd`. This will build the frontend, install backend dependencies, and then start the app.
4. You can see the local running app at http://127.0.0.1:5000.


## Deploy the app

### One click Azure deployment
[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fruoccofabrizio%2Fsample-app-aoai-chatGPT%2Fmain%2Finfrastructure%2Fdeployment.json)

Click on the Deploy to Azure button and configure your settings in the Azure Portal as described in the [Environment variables](#environment-variables) section.

Please be aware that you need:
-   an existing Azure OpenAI resource with models deployment
-   OPTIONALLY - an existing Azure Cognitive Search

### Deploy from your local machine

You can use the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) to deploy the app from your local machine. Make sure you have version 2.48.1 or later.

If this is your first time deploying the app, you can use [az webapp up](https://learn.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-up). Run the following command from the root folder of the repo, updating the placeholder values to your desired app name, resource group, location, and subscription. You can also change the SKU if desired.

`az webapp up --runtime PYTHON:3.10 --sku B1 --name <new-app-name> --resource-group <resource-group-name> --location <azure-region> --subscription <subscription-name>`

If you've deployed the app previously from the AOAI studio, first run this command to update the appsettings to allow local code deployment:

`az webapp config appsettings set -g <resource-group-name> -n <existing-app-name> --settings WEBSITE_WEBDEPLOY_USE_SCM=false`

Then, use the `az webapp up` command to deploy your local code to the existing app:

`az webapp up --runtime PYTHON:3.10 --sku B1 --name <existing-app-name> --resource-group <resource-group-name>`

Make sure that the app name and resource group match exactly for the app that was previously deployed.

Deployment will take several minutes. When it completes, you should be able to navigate to your app at {app-name}.azurewebsites.net.

## Best Practices
Feel free to fork this repository and make your own modifications to the UX or backend logic. For example, you may want to expose some of the settings in `app.py` in the UI for users to try out different behaviors. We recommend keeping these best practices in mind:

- Reset the chat session (clear chat) if the user changes any settings. Notify the user that their chat history will be lost.
- Clearly communicate to the user what impact each setting will have on their experience.
- When you rotate API keys for your AOAI or ACS resource, be sure to update the app settings for each of your deployed apps to use the new key.

## Environment variables

| App Setting | Value | Note |
| --- | --- | ------------- |
|AZURE_SEARCH_SERVICE|||
|AZURE_SEARCH_INDEX|||
|AZURE_SEARCH_KEYv
|AZURE_SEARCH_USE_SEMANTIC_SEARCH|False||
|AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG|default||
|AZURE_SEARCH_INDEX_IS_PRECHUNKED|False||
|AZURE_SEARCH_TOP_K|5||
|AZURE_SEARCH_ENABLE_IN_DOMAIN|False||
|AZURE_SEARCH_CONTENT_COLUMNS|||
|AZURE_SEARCH_FILENAME_COLUMN|||
|AZURE_SEARCH_TITLE_COLUMN|||
|AZURE_SEARCH_URL_COLUMN|||
|AZURE_OPENAI_RESOURCE|||
|AZURE_OPENAI_MODEL|||
|AZURE_OPENAI_KEY|||
|AZURE_OPENAI_DEPLOYMENT|||
|AZURE_OPENAI_TEMPERATURE|0||
|AZURE_OPENAI_TOP_P|1.0||
|AZURE_OPENAI_MAX_TOKENS|1000||
|AZURE_OPENAI_STOP_SEQUENCE|||
|AZURE_OPENAI_SYSTEM_MESSAGE|You are an AI assistant that helps people find information.||
|AZURE_OPENAI_API_VERSION|2023-06-01-preview||


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
