import argparse
from asyncio import sleep
import json

from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

from data_utils import get_embedding

RETRY_COUNT = 5

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_data_path", type=str, required=True)
    parser.add_argument("--output_file_path", type=str, required=True)
    parser.add_argument("--config_file", type=str, required=True)

    args = parser.parse_args()

    with open(args.config_file) as f:
        config = json.load(f)

    credential = DefaultAzureCredential()

    if type(config) is not list:
        config = [config]
    
    for index_config in config:
        # Keyvault Secret Client
        keyvault_url = index_config.get("keyvault_url")
        if not keyvault_url:
            print("No keyvault url provided in config file. Secret client will not be set up.")
            secret_client = None
        else:
            secret_client = SecretClient(keyvault_url, credential)

        # Get Embedding key
        embedding_key_secret_name = index_config.get("embedding_key_secret_name")
        if not embedding_key_secret_name:
            raise ValueError("No embedding key secret name provided in config file. Embeddings will not be generated.")
        else:
            embedding_key_secret = secret_client.get_secret(embedding_key_secret_name)
            embedding_key = embedding_key_secret.value

        embedding_endpoint = index_config.get("embedding_endpoint")
        if not embedding_endpoint:
            raise ValueError("No embedding endpoint provided in config file. Embeddings will not be generated.")

        # Embed documents
        print("Generating embeddings...")
        with open(args.input_data_path) as input_file, open(args.output_file_path, "w") as output_file:
            for line in input_file:
                document = json.loads(line)
                # Sleep/Retry in case embedding model is rate limited.
                for _ in range(RETRY_COUNT):
                    try:
                        embedding = get_embedding(document["content"], embedding_endpoint,  embedding_key)
                        document["contentVector"] = embedding
                        break
                    except:
                        print("Error generating embedding. Retrying...")
                        sleep(30)
                
                output_file.write(json.dumps(document) + "\n")

        print("Embeddings generated and saved to {}.".format(args.output_file_path))

