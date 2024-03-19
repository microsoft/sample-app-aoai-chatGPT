# Sync SharePoint Site documents to Blob Storage

This folder contains the ARM template of a sample Logic App that can sync your SharePoint site documents to your blob storage.

## Prerequisites

- An Azure Cognitive Search resource to store the sharepoint index

## Quick Start

1. Click the following button to deploy the ARM template to your Azure Subscription. You will be asked to provide the following inputs:

#### Feature Specific Inputs

- `Share Point Url`: The Url of the input Sharepoint site (e.g., https://microsoft.sharepoint.com/teams/YourSharepointSiteName)
- `Storage Accounts_armblobqueue_name`: A storage account name to be created and used to store sharepoint documents and their access control information
- `Enqueue Interval`: An integer to specify (in minutes) how often Sharepoint site should be scanned for documents and/or permission updates

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://ms.portal.azure.com/#view/Microsoft_Azure_CreateUIDef/CustomDeploymentBlade/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmicrosoft%2Fsample-app-aoai-chatGPT%2Ffshakerin%2Fsp%2Fpland%2Fsharepoint2blob%2Fsharepoint2blobarm.json)


2. After a successful deployment, you will need to authorize the sharepoint connector to be able to access the sharepoint site.

- 2.1. Go to the resource group to which the ARM template was deployed.
- 2.2. Find the API Connection `sharepointonline` and click on it.
- 2.3. On the left menu, find the `Edit API Connection` under General section and click on it.
- 2.4. Click on Authorize button and log in.
- 2.5. Click on save button.

once all files are copied from the sharepoint site to the blob container, you can proceed to the step 3.


**Note:** There is no notification mechanism to indicate the end of copying process. It is left to the customer to verify that all files were copied. 
Folder Statistics in Azure storage explorer and OneDrive can be used to compare the number of blobs in container and files in Sharepoint respectively.


3. Creating Azure Cogntive Search Index using `2023-10-01-preview` [ingestion API](https://learn.microsoft.com/en-us/rest/api/azureopenai/ingestion-jobs/create?view=rest-azureopenai-2023-10-01-preview&tabs=HTTP).    

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

## Limitations
- Currently, we only support AAD security groups (principleType = 4) during ingestion. The User (principleType = 1), DistributionList (principleType = 2), and Shared Links are not ingested. As a result, those categories are treated as unauthorized.  
- The blob metadata length is limited to 8K. As a result, a document cannot have more than roughly 200 security groups assigned to.
- Sharepoint file names cannot contain non-ascii characters. This is a limitation of Azure blob metadata as the metadata is pushed in http headers only.

