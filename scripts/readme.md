# Data Preparation

## Setup
- Install the necessary packages listed in requirements.txt, e.g. `pip install --user -r requirements.txt`

## Configure
- Create a config file like `config.json`. The format should be a list of JSON objects, with each object specifying a configuration of local data path and target search service and index.

```
[
    {
        "data_path": "<path to data>",
        "location": "<azure region, e.g. 'westus2'>", 
        "subscription_id": "<subscription id>",
        "resource_group": "<resource group name>",
        "search_service_name": "<search service name to use or create>",
        "index_name": "<index name to use or create>",
        "chunk_size": 1024, // set to null to disable chunking before ingestion
        "token_overlap": 128 // number of tokens to overlap between chunks
        "semantic_config_name": "default",
        "language": "en" // setting to set language of your documents. Change if your documents are not in English. Look in data_preparation.py for SUPPORTED_LANGUAGE_CODES,
        "vector_config_name": "default" // used if adding vectors to index
    }
]
```

## Create Indexes and Ingest Data
Disclaimer: Make sure there are no duplicate pages in your data. That could impact the quality of the responses you get in a negative way.

- Run the data preparation script, passing in your config file. You can set njobs for parallel parsing of your files.

     `python data_preparation.py --config config.json --njobs=4`

## Optional: Add vector embeddings
Azure Cognitive Search supports vector search in public preview. See [the docs](https://learn.microsoft.com/en-us/azure/search/vector-search-overview) for more information.

To add vectors to your index, you will first need an [Azure OpenAI resource](https://learn.microsoft.com/en-us/azure/ai-services/openai/overview) with an [Ada embedding model deployment](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#embeddings-models). The `text-embedding-ada-002` model is supported.

- Get the endpoint and API key for embedding model deployment. The API key can be found in the Azure Portal under Resource Management for your Azure OpenAI resource, you can use either Key 1 or Key 2. The endpoint will generally be of the format `https://<azure openai resource name>.openai.azure.com/openai/deployments/<ada deployment name>/embeddings?api-version=2023-06-01-preview`.
- Run the data preparation script, passing in your config file and the embedding endpoint and key as extra arguments:

      `python data_preparation.py --config config.json --embedding-model-endpoint "<embedding endpoint>" --embedding-model-key "<azure openai resource key>"`

## Optional: Crack PDFs to Text
If your data is in PDF format, you'll first need to convert from PDF to .txt format. You can use your own script for this, or use the provided conversion code here. 

### Setup for PDF Cracking
- Create a [Form Recognizer](https://learn.microsoft.com/en-us/azure/applied-ai-services/form-recognizer/create-a-form-recognizer-resource?view=form-recog-3.0.0) resource in your subscription 
- Make sure you have the Form Recognizer SDK: `pip install azure-ai-formrecognizer`
- Run the following command to get an access key for your Form Recognizer resource:
  `az cognitiveservices account keys list --name "<form-rec-resource-name>" --resource-group "<resource-group-name>"`

  Copy one of the keys returned by this command.

### Create Indexes and Ingest Data from PDF with Form Recognizer
Pass in your Form Recognizer resource name and key when running the data preparation script:

`python data_preparation.py --config config.json --njobs=4 --form-rec-resource <form-rec-resource-name> --form-rec-key <form-rec-key>`

This will use the Form Recognizer Read model by default. 

If your documents have a lot of tables and relevant layout information, you can use the Form Recognizer Layout model, which is more costly and slower to run but will preserve table information with better quality. The Layout model will also help preserve some of the formatting information in your document such as titles and sub-headings, which will make the citations more readable. To use the Layout model instead of the default Read model, pass in the argument `--form-rec-use-layout`.

`python data_preparation.py --config config.json --njobs=4 --form-rec-resource <form-rec-resource-name> --form-rec-key <form-rec-key> --form-rec-use-layout`