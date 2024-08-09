 #!/bin/sh

. ./scripts/loadenv.sh

echo 'Running "prepdocs.py"'
./.venv/bin/python ./scripts/prepdocs.py --searchservice "$AZURE_SEARCH_SERVICE" --index "$AZURE_SEARCH_INDEX" --formrecognizerservice "$AZURE_FORMRECOGNIZER_SERVICE" --tenantid "$AZURE_TENANT_ID" --embeddingendpoint "https://$AZURE_OPENAI_RESOURCE.openai.azure.com/openai/deployments/$AZURE_OPENAI_EMBEDDING_NAME/embeddings?api-version=2024-06-01"
