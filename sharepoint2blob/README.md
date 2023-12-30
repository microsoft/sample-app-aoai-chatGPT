# Sync SharePoint Site documents to Blob Storage

This folder contains the ARM template of a sample Logic App that can sync your SharePoint site documents to your blob storage.

## Quick Start

Click the following button to deploy the sample Logic App to your Azure Subscription.

[![Deploy to Azure](https://github.com/MicrosoftDocs/azure-docs/raw/main/articles/media/template-deployments/deploy-to-azure.svg)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FAzure%2Fazure-quickstart-templates%2Fmaster%2Fquickstarts%2Fmicrosoft.logic%2Flogic-app-create%2Fazuredeploy.json)



After deployment, you will need to authenticate to the two deployed connectors so the Logic App can use the connectors access the SharePoint and blob storage.

Continue read the following sections to learn more details about the deployed Logic App workflow.

## Sub Folders

The sub folders are expanded recursively to discover the files from the SharePoint.

## Files

The follow file formats are copied: pdf, docx, pptx, txt, html

Single file cannot be larger than 5MB.

Total files

## Incremental Update

When a file is not modified on the SharePoint, it won't be download and updated on blob storage. We compare the `lastModifiedDateTime` metadata to tell if a file has been modified.

## Deletion Tracking

When a file is deleted from the SharePoint, it will also be deleted from the blob storage in the next run.

## Metadata

The following properties are kept when copying the files from SharePoint site to blob storage as blob metadata: `webUrl`, `createdBy`, `lastModifiedDateTime`

## Permissions

The blob metadata `permittedGroupIds` is a comma separated list, each element is the object id of the security group. Note individual user permission and site permission are not kept. The shared links are also not honored.

