
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