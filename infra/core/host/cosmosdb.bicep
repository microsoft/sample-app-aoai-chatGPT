param name string
param appServiceName string
param appServicePrincipal string
param location string = resourceGroup().location
param cosmosdb_database_name string
param cosmosdb_container_name string

var roleDefinitionId = '00000000-0000-0000-0000-000000000002'
var roleAssignmentId = guid(roleDefinitionId, appServiceName, cosmosdb_account_name.id)

resource cosmosdb_account_name 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: name
  location: location
  kind: 'GlobalDocumentDB'
  /*identity: {
    type: 'SystemAssigned'
  }*/
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
  }
}

resource cosmosdb_account_name_cosmosdb_database_name 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosdb_account_name
  name: '${cosmosdb_database_name}'
  properties: {
    resource: {
      id: cosmosdb_database_name
    }
  }
}

resource cosmosdb_account_name_cosmosdb_database_name_conversations 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosdb_account_name_cosmosdb_database_name
  name: 'conversations'
  properties: {
    resource: {
      id: 'conversations'
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      partitionKey: {
        paths: [
          '/userId'
        ]
        kind: 'Hash'
      }
      conflictResolutionPolicy: {
        mode: 'LastWriterWins'
        conflictResolutionPath: '/_ts'
      }
    }
  }
}

resource cosmosdb_account_name_roleAssignmentId 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2021-04-15' = {
  parent: cosmosdb_account_name
  name: '${roleAssignmentId}'
  properties: {
    roleDefinitionId: resourceId('Microsoft.DocumentDB/databaseAccounts/sqlRoleDefinitions', split('${name}/${roleDefinitionId}', '/')[0], split('${name}/${roleDefinitionId}', '/')[1])
    principalId: appServicePrincipal
    scope: cosmosdb_account_name.id
  }
}

output container_name string = cosmosdb_container_name
output database_name string = cosmosdb_database_name
output account_name string = name
