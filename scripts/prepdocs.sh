 #!/bin/sh

. ./scripts/loadenv.sh

echo 'Running "prepdocs.py"'
python3 ./scripts/prepdocs.py --searchservice "$AZURE_SEARCH_SERVICE" --index "$AZURE_SEARCH_INDEX" --formrecognizerservice "$AZURE_FORMRECOGNIZER_SERVICE" --tenantid "$AZURE_TENANT_ID"
