#!/bin/bash

json_file=$1

# Check if the JSON file exists
if [ ! -f "$json_file" ]; then
  echo "Error: JSON file not found."
  exit 1
fi

# Convert JSON to the desired format using jq
jq -r '.[] | "\(.name)=\"\(.value)\""' "$json_file"
