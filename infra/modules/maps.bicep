// Azure Maps account. The browser SDK authenticates via Microsoft Entra ID using a
// token minted by the app's managed identity (see src/app/api/maps/token), so the app
// identity is granted the data-plane "Azure Maps Data Reader" role here. The shared key
// is still stashed in Key Vault for tooling/fallback.
param location string = 'global'
param namePrefix string
param tags object

@description('Principal id of the app managed identity to grant map data access.')
param appIdentityPrincipalId string

// Azure Maps Data Reader — read-only data-plane access for token-based auth.
var mapsDataReaderRoleId = '423170ca-a8f6-4b0f-8487-9e4eb8f49bfa'

resource maps 'Microsoft.Maps/accounts@2023-06-01' = {
  name: '${namePrefix}-maps'
  location: location
  tags: tags
  sku: {
    name: 'G2'
  }
  kind: 'Gen2'
  properties: {
    disableLocalAuth: false
  }
}

resource mapsDataReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(maps.id, appIdentityPrincipalId, mapsDataReaderRoleId)
  scope: maps
  properties: {
    principalId: appIdentityPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      mapsDataReaderRoleId
    )
  }
}

output name string = maps.name
// The account's unique client id, sent to the browser SDK for Entra ID auth.
output clientId string = maps.properties.uniqueId
#disable-next-line outputs-should-not-contain-secrets
output primaryKey string = maps.listKeys().primaryKey
