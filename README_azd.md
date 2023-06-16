# (Preview) Sample Chat App with AOAI

## Deploying with the Azure Developer CLI

> **IMPORTANT:** In order to deploy and run this example, you'll need an **Azure subscription with access enabled for the Azure OpenAI service**. You can request access [here](https://aka.ms/oaiapply). You can also visit [here](https://azure.microsoft.com/free/cognitive-search/) to get some free Azure credits to get you started. Your Azure Account must have `Microsoft.Authorization/roleAssignments/write` permissions, such as [User Access Administrator](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#user-access-administrator) or [Owner](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#owner).

> **AZURE RESOURCE COSTS** by default this sample will create Azure App Service and Azure Cognitive Search resources that have a monthly cost, as well as Form Recognizer resource that has cost per document page. You can switch them to free versions of each of them if you want to avoid this cost by changing the parameters file under the infra folder (though there are some limits to consider; for example, you can have up to 1 free Cognitive Search resource per subscription, and the free Form Recognizer resource only analyzes the first 2 pages of each document.)

## Opening the project

This project has [Dev Container support](https://code.visualstudio.com/docs/devcontainers/containers), so it will be be setup automatically if you open it in Github Codespaces or in local VS Code with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

If you're not using one of those options for opening the project, then you'll need to:

1. Install prerequisites:

    - [Azure Developer CLI](https://aka.ms/azure-dev/install)
    - [Python 3+](https://www.python.org/downloads/)
        - **Important**: Python and the pip package manager must be in the path in Windows for the setup scripts to work.
    - [Node.js](https://nodejs.org/en/download/)
    - [Git](https://git-scm.com/downloads)
    - [Powershell 7+ (pwsh)](https://github.com/powershell/powershell) - For Windows users only.
    - **Important**: Ensure you can run `pwsh.exe` from a PowerShell command. If this fails, you likely need to upgrade PowerShell.

2. Create a [Python virtual environment](https://docs.python.org/3/tutorial/venv.html#creating-virtual-environments) and activate it.

3. Install the Python requirements:

    ```shell
    python3 -m pip install -r requirements-dev.txt
    ```


### Starting from scratch:

If you don't have any pre-existing Azure services (i.e. OpenAI or Cognitive Search service), then you can provision
all resources from scratch by following these steps:

1. Run `azd auth login` to login to your Azure account.
1. Run `azd up` to provision Azure resources and deploy this sample to those resources. This also runs a script to build the search index based on files in the `./data` folder.
1. After the application has been successfully deployed you will see a URL printed to the console.  Click that URL to interact with the application in your browser.
    > NOTE: It may take a minute for the application to be fully deployed. If you see a "Python Developer" welcome screen, then wait a minute and refresh the page.

### Use existing resources:

If you have existing Azure resources that you want to reuse, then you must first set `azd` environment variables _before_ running `azd up`.

Run the following commands based on what you want to customize:

* `azd env set AZURE_OPENAI_RESOURCE {Name of existing OpenAI service}`
* `azd env set AZURE_OPENAI_RESOURCE_GROUP {Name of existing resource group that OpenAI service is provisioned to}`
* `azd env set AZURE_OPENAI_SKU_NAME {Name of OpenAI SKU}`. Defaults to 'S0'.
* `azd env set AZURE_SEARCH_SERVICE {Name of existing Cognitive Search service}`
* `azd env set AZURE_SEARCH_SERVICE_RESOURCE_GROUP {Name of existing resource group that Cognitive Search service is provisioned to}`
* `azd env set AZURE_SEARCH_SKU_NAME {Name of Cognitive Search SKY}`. Defaults to 'standard'.
* `azd env set AZURE_FORMRECOGNIZER_SERVICE {Name of existing Form Recognizer service}`. Used by prepdocs.py for text extraction from docs.
* `azd env set AZURE_FORMRECOGNIZER_SERVICE_RESOURCE_GROUP {Name of existing resource group that Form Recognizer service is provisioned to}`.
* `azd env set AZURE_FORMRECOGNIZER_SKU_NAME {Name of Form Recognizer SKU}`. Defaults to 'S0'.

1. Run `azd auth login` to login to your Azure account.
1. Run `azd up` to provision Azure resources and deploy this sample to those resources. This also runs a script to build the search index based on files in the `./data` folder.
1. After the application has been successfully deployed you will see a URL printed to the console.  Click that URL to interact with the application in your browser.
    > NOTE: It may take a minute for the application to be fully deployed. If you see a "Python Developer" welcome screen, then wait a minute and refresh the page.


### Re-deploying changes

If you make any changes to the app code (JS or Python), you can re-deploy the app code to App Service by running the `azd deploy` command.

If you change any of the Bicep files in the infra folder, then you should re-run `azd up` to both provision resources and deploy code.

### Running locally:

1. Run `azd auth login`
2. Run `./start.cmd` or `./start.sh` to start the project locally.
3. Navigate to `http://127.0.0.1:5000` in your browser. The deployed code requires authentication, but the local app should allow access as long as it's access from `127.0.0.1`.

### Note

>Note: The PDF documents used in this demo contain information generated using a language model (Azure OpenAI Service). The information contained in these documents is only for demonstration purposes and does not reflect the opinions or beliefs of Microsoft. Microsoft makes no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability or availability with respect to the information contained in this document. All rights reserved to Microsoft.
