# Lerøy HR assistant 

This repo contains code for Lerøy HR assistant chat webapp that integrates with Azure OpenAI. Note: some portions of the app use preview APIs.

![](hr_assistant.png)

## Deploy the app
TODO: Deploy through Copilot instead.
#https://devblogs.microsoft.com/microsoft365dev/deploy-your-chatgpt-based-model-securely-using-microsoft-teams-power-virtual-agent-and-azure-openai/

### Deploy from your local machine

#### Local Setup: Basic Chat Experience
1. Copy `.env.sample` to a new file called `.env` and configure the settings as described in the [Environment variables](#environment-variables) section.
    
    These variables are required:
    - `AZURE_OPENAI_RESOURCE`
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

#### Local Setup: Chat with your data (Preview)
[More information about Azure OpenAI on your data](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/concepts/use-your-data)

1. Update the `AZURE_OPENAI_*` environment variables as described above. 
2. To connect to your data, you need to specify an Azure Cognitive Search index to use. You can [create this index yourself](https://learn.microsoft.com/en-us/azure/search/search-get-started-portal) or use the [Azure AI Studio](https://oai.azure.com/portal/chat) to create the index for you.

    These variables are required when adding your data with Azure AI Search:
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

#### Local Setup: Enable SQL Server
To enable SQL Server, you will need to set up SQL Server resources. Then specify these additional environment variables:
- `DATASOURCE_TYPE` (Should be set to `AzureSqlServer`)
- `AZURE_SQL_SERVER_CONNECTION_STRING`
- `AZURE_SQL_SERVER_TABLE_SCHEMA`

#### Deploy with the Azure CLI
**NOTE**: If you've made code changes, be sure to **build the app code** with `start.cmd` or `start.sh` before you deploy, otherwise your changes will not be picked up. If you've updated any files in the `frontend` folder, make sure you see updates to the files in the `static` folder before you deploy.

You can use the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) to deploy the app from your local machine. Make sure you have version 2.48.1 or later.

If this is your first time deploying the app, you can use [az webapp up](https://learn.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-up). Run the following two commands from the root folder of the repo, updating the placeholder values to your desired app name, resource group, location, and subscription. You can also change the SKU if desired.

1. `az webapp up --runtime PYTHON:3.11 --sku B1 --name <new-app-name> --resource-group <resource-group-name> --location <azure-region> --subscription <subscription-name>`
1. `az webapp config set --startup-file "python3 -m gunicorn app:app" --name <new-app-name>`

If you've deployed the app previously, first run this command to update the appsettings to allow local code deployment:

`powershell .\setenv.ps1 -resourceGroup <resource-group-name>  -webappName <existing-app-name> `

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

### Using Entra ID

The app uses Azure OpenAI on your data [(see documentation)](https://learn.microsoft.com/en-us/azure/ai-services/openai/references/on-your-data). To enable Entra ID for intra-service authentication

1. Enable managed identity on Azure OpenAI
2. Configure AI search to allow access from Azure OpenAI
   1. Enable Role Based Access control on the used AI search instance [(see documentation)](https://learn.microsoft.com/en-us/azure/search/search-security-enable-roles)
   2. Assign `Search Index Data Reader` and `Search Service Contributor` to the identity of the Azure OpenAI instance
3. Do not configure `AZURE_SEARCH_KEY` and `AZURE_OPENAI_KEY` to use Entra ID authentication.
4. Configure the webapp identity
   1. Enable managed identity in the app service that hosts the webapp
   2. Go to the Azure OpenAI instance and assign the role `Cognitive Services OpenAI User` to the identity of the webapp

Note: RBAC assignments can take a few minutes before becoming effective.

### Best Practices
We recommend keeping these best practices in mind:

- Reset the chat session (clear chat) if the user changes any settings. Notify the user that their chat history will be lost.
- Clearly communicate to the user what impact each setting will have on their experience.
- When you rotate API keys for your AOAI or ACS resource, be sure to update the app settings for each of your deployed apps to use the new key.
- Pull in changes from `main` frequently to ensure you have the latest bug fixes and improvements, especially when using Azure OpenAI on your data.

**A note on Azure OpenAI API versions**: To keep the application up-to-date as the Azure OpenAI API evolves with time, be sure to merge the latest API version update into your own application code and redeploy using the methods described in this document.