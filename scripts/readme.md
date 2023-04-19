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
        "semantic_config_name": "default"
    }
]
```

## Create Indexes and Ingest Data
- Run the data preparation script, passing in your config file.

     `python data_preparation.py --config config.json`

