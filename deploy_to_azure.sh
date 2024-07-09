#!/bin/bash

# Set environment variables
WEBAPP_NAME=${1}
LOCATION=${2}
RESOURCE_GROUP=${3}
SUBSCRIPTION=${4}
SERVICE_PLAN=${5}
RESOURCE_GROUP_APP=${6}
AZURE_OPENAI_EMBEDDING_NAME=${7}
AZURE_OPENAI_ENDPOINT=${8}
AZURE_OPENAI_MODEL=${9}

# Configure app settings
az webapp config appsettings set -g $RESOURCE_GROUP -n $WEBAPP_NAME --settings WEBSITE_WEBDEPLOY_USE_SCM=false

# Deploy the web app
az webapp up --runtime PYTHON:3.11 --sku B1 --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --location "$LOCATION" --subscription $SUBSCRIPTION --plan $SERVICE_PLAN

# Set the startup file
az webapp config set --startup-file "python3 -m gunicorn app:app" --name $WEBAPP_NAME

# Set web app environment variables
az webapp config appsettings set --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP_APP --settings \
  AZURE_OPENAI_EMBEDDING_NAME=$AZURE_OPENAI_EMBEDDING_NAME \
  AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT \
  AZURE_OPENAI_MODEL=$AZURE_OPENAI_MODEL
