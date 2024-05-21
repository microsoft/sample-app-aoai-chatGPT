# Document Upload

This feature allows users to upload oneoff documents into the conversation and to chat with them.  This satisfies a use case where a) some documents should not be exposed to the rest of the users and group security is not viable and b) users do not have access to an upload mechanism to get the documents into storage for indexing.  The search results are contained to the conversation if using the defaults below.  It can also be configured to restrict the document to the user and not the conversation.  This would allow the user to have access to all documents on all that users conversations.

## Prerequisites
- An existing Azure OpenAI resource and model deployment of a chat model (e.g. `gpt-35-turbo-16k`, `gpt-4`)
- To use the docupload feature the following resources:
    - Azure Blob Storage Container
    - Azure AI Search
        - Index, indexer and skillset (created below in quick setup)
    - Azure OpenAI
    - CosmosDB (for chat history - not covered in this guide, see main readme)

### Configuring vector search
See the main readme for more information, but a sample setup might be:
- `AZURE_SEARCH_QUERY_TYPE`: vector
- `AZURE_OPENAI_EMBEDDING_NAME`: text-embedding-ada-002
- `AZURE_SEARCH_VECTOR_COLUMNS`: vector

## Quick Setup
Create or go to your AI Search Service.
- Click the Import and vectorize data button on the overview tab.
- In the 'Connect to your data' section:
    - Choose your storage account blob container and blob folder (obtional), reccomended to use the System Identity to authenticate.
    - Reccomend setting up soft delete later in the docupload-datasource
- In the 'Vectorize and enrich data' section:
    - Choose your Azure OpenAI resource, model deployment (reccomend text-embeddings-ada-002)
    - Choose your authentication type, (again reccommend System Identity)
    - Extracting text from images is not tested at this time
    - Enable the semantic ranker (optional, extra cost involved, see Azure documentation)
    - Choose 'Once' for your Index schedule
- In the 'Review and create' section:
-   Select a prefix, in this example I will use 'docupload'

This will create the following 3 items in your AI Search:
- A datasource named docupload-datasource
- An index named docupload
    - The index has a column pre-defined for storing vectors named 'vector', make sure to set `AZURE_SEARCH_VECTOR_COLUMNS` to this value if following this guide
    - If you chose to use semantic ranking, a 'docupload-semantic-configurtation' will be created inside the index, you may use this as the value for the `AZURE_SEARCH_SEMANTIC_SEARCH_CONFIG` variable along with setting `AZURE_SEARCH_QUERY_TYPE` to semantic or vectorSemanticHybrid (best performance)
- An indexer named docupload-indexer, this will serve as the template for creating one off indexers for each document
- A skillset named docupload-skillset

To finish setup, we need to alter these to handle conversation_id and user_id restriction:
- Edit the docupload index
    - Add a string field named conversation_id, mark as Retrievable, Filterable and Searchable
    - Add a string field named user_id, mark as Retrievable, Filterable and Searchable
- Edit the docupload-indexer
    - Check the 'Allow skillset to read file data' checkbox
- Edit the skillset
    - Add the following JSON to the end of the indexProjections/selectors/mappings array, this will map the conversation_id and user_id into the index to restrict documents to the conversation/user depending on how the `DOCUPLOAD_RESTRICT_BY...` variables are set.
    ,{
        "name": "conversation_id",
        "source": "/document/conversation_id",
        "sourceContext": null,
        "inputs": []
        },
        {
        "name": "user_id",
        "source": "/document/user_id",
        "sourceContext": null,
        "inputs": []
    }
    - NOTE: BEFORE YOU SAVE, you must re input the value for skills/apiKey to your Azure OpenAI resource, it has been redacted away

## Environment variables

Note: settings starting with `AZURE_SEARCH` are only needed when using Azure OpenAI on your data with Azure AI Search. If not connecting to your data, you only need to specify `AZURE_OPENAI` settings.

| App Setting | Value | Note |
| --- | --- | ------------- |
|DOCUPLOAD_AZURE_BLOB_STORAGE_ACCOUNT_NAME||The resource name of your Azure storage account|
|DOCUPLOAD_AZURE_BLOB_CONTAINER||The blob container that you wish to use|
|DOCUPLOAD_AZURE_BLOB_FOLDER|docupload|The folder in which the uploaded documents will be stored|
|DOCUPLOAD_AZURE_BLOB_STORAGE_KEY||The access key for the storage account|
|DOCUPLOAD_AZURE_SEARCH_INDEXER|docupload-indexer|The name of the indexer.  In order to support simultaneous users, this indexer will be cloned and run for a single document|
|DOCUPLOAD_DELETE_BLOB_ON_CONVERSATION_DELETE|True|Whether or not to delete the related blobs when a conversation is deleted|
|DOCUPLOAD_DELETE_INDEX_DOCUMENT_ON_CONVERSATION_DELETE|True|Whether or not to delete the related index chunks when a conversation is deleted|
|DOCUPLOAD_INDEX_DOCUMENT_KEY|chunk_id|The unique key for each index chunk.|
|DOCUPLOAD_RESTRICT_BY_CONVERSATIONID|True|Whether or not to restrict document uploads to their corresponding conversation|
|DOCUPLOAD_RESTRICT_BY_USERID|False|Whether or not to restrict document uploads to their corrsponding user (note that ConversationID is more restrictive than User so only one of these needs to be set)|
|DOCUPLOAD_GLOBAL_TAG|conversation_id|The tag to use to determine which documents are global (available to all users, regardless of conversation/user restrictions)|
|DOCUPLOAD_GLOBAL_TAG_VALUE|null|The value to use to determine which documents are global. (With the defaults values of DOCUPLOAD_GLOBAL_TAG = conversation_id and DOCUPLOAD_GLOBAL_TAG_VALUE = null, all documents manually uploaded with no conversation_id tag are considered global. Alternatively, if you want documents to be manually marked as global you could set the DOCUPLOAD_GLOBAL_TAG to "global" and the tag value to "true".  This would mean that documents are not considered global until marked in this way.  NOTE: You must manually run the indexer to pick up this document.  In order to avoid re-indexing all docs, consider setting up incremental enrichment and caching to your indexer.|
|DOCUPLOAD_MAX_SIZE_MB|5|Maximum upload size in MegaBytes|

## System message

When using vectors, the matching will always return documents and will give a score on simlarity.  If you have some global documents indexed, they will return and be considered even when not uploading a document and just asking general questions.  This will sometimes cause the system to return "I can't find the information in the retreived documents" even when asking simple questions like "What is the capital of France?"  It is therefore reccomeneded to use prompt engineering to work around this issue and change the `AZURE_OPENAI_SYSTEM_MESSAGE` to 

"You are an AI assistant that helps people find information.  Ignore irrelevant documents.  If you can find no relevant documents, answer from general knowledge. If the user is directly referencing a document, ONLY then if you can't find it say so. If no relevant documents are found, do not mention it and answer from general knowledge."

## Security
A quick note about security.  It is reccomended to enable the System Identity for all services and grant the proper rights to each identity.  For example, Storage Blob Contributor and Reader and Data Access to the Azure Search Identity as well as to the Azure OpenAI resource.  Azure Open AI will need these same permissions to crack the documents and create embeddings.
