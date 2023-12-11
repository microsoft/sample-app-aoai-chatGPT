# Introduction
Below are some flows to follow to make sure code changes are tested effectivly and efficiently. 
The goal is to make sure that this is repeatable and can be done by anyone to avoid regressions.

## Test Case Flows
- with data, streaming
- with data, non streaming
- without data, streaming
- without data, non streaming
- All of the above with and without chat history

### With Data, Streaming
The following environment variables are required to run this test case:

`AZURE_SEARCH_SERVICE`\
`AZURE_SEARCH_INDEX`\
`AZURE_SEARCH_KEY`

`AZURE_OPENAI_STREAM` should be set to `true`

### With Data, Streaming, Chat History
Keep the same environment variables as above, but add the following:

`AZURE_COSMOSDB_DATABASE`\
`AZURE_COSMOSDB_ACCOUNT`\
`AZURE_COSMOSDB_CONVERSATIONS_CONTAINER`\
`AZURE_COSMOSDB_ACCOUNT_KEY`

### With Data, Nonstreaming
The following environment variables are required to run this test case:
`AZURE_SEARCH_SERVICE`\
`AZURE_SEARCH_INDEX`\
`AZURE_SEARCH_KEY`

`AZURE_OPENAI_STREAM` should be set to `false`

### With Data, Nonstreaming, Chat History
Keep the same environment variables as above, but add the following:

`AZURE_COSMOSDB_DATABASE`\
`AZURE_COSMOSDB_ACCOUNT`\
`AZURE_COSMOSDB_CONVERSATIONS_CONTAINER`\
`AZURE_COSMOSDB_ACCOUNT_KEY`

### Without Data, Streaming
The following environment variables should **not** be set:

`AZURE_SEARCH_SERVICE`\
`AZURE_SEARCH_INDEX`\
`AZURE_SEARCH_KEY`

`AZURE_OPENAI_STREAM` should be set to `true`

### Without Data, Streaming, Chat History
Keep the same environment variables as above, but add the following:

`AZURE_COSMOSDB_DATABASE`\
`AZURE_COSMOSDB_ACCOUNT`\
`AZURE_COSMOSDB_CONVERSATIONS_CONTAINER`\
`AZURE_COSMOSDB_ACCOUNT_KEY`

### Without Data, Nonstreaming
The following environment variables should **not** be set:

`AZURE_SEARCH_SERVICE`\
`AZURE_SEARCH_INDEX`\
`AZURE_SEARCH_KEY`

`AZURE_OPENAI_STREAM` should be set to `false`

### Without Data, Nonstreaming, Chat History
Keep the same environment variables as above, but add the following:

`AZURE_COSMOSDB_DATABASE`\
`AZURE_COSMOSDB_ACCOUNT`\
`AZURE_COSMOSDB_CONVERSATIONS_CONTAINER`\
`AZURE_COSMOSDB_ACCOUNT_KEY`