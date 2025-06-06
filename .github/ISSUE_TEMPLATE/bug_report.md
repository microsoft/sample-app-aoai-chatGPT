---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Configuration: Please provide the following**
 - Azure OpenAI model name and version (e.g. 'gpt-35-turbo-16k, version 0613')
 - Is chat history enabled?
 - Are you using data? If so, what data source? (e.g. Azure AI Search, Azure CosmosDB Mongo vCore, etc)
- Verify the startup command and runtime configuration by showing the output of the following az CLI command:
```
az webapp show --name <app name> --resource-group <resource group name> --query "{startupCommand: siteConfig.appCommandLine, runtime: siteConfig.linuxFxVersion}"
```

**Logs**

1. If the application deployment is failing, please share the deployment logs using the following az CLI command:
```
az webapp log deployment show --name <app name> --resource-group <rg name>
```

2. If the application is crashing after deployment, please share the application logs using the following az CLI command:
```
az webapp log tail --name <app name> --resource-group <resource group name>
```

**Additional context**
Add any other context about the problem here.
