# [Preview] Sample Chat App with AOAI

This repo contains sample code for a simple chat webapp that integrates with Azure OpenAI. Some portions of the app use preview APIs and features that should not be used for any production dependency.

## Run the app
Update the environment variables listed in `app.py`. At minimum, you need to specify `AZURE_OPENAI_RESOURCE`, `AZURE_OPENAI_MODEL`, and `AZURE_OPENAI_KEY`.
Start the app with `start.cmd`.
This will build the frontend, install backend dependencies, and then start the app.
You can see the local running app at http://127.0.0.1:5000.
Note: this app is under construction!

## Deploy the app

You can use the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) to deploy the app from your local machine. 

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
