// Key Vault (RBAC) holding app secrets, with Key Vault Secrets User granted to the
// app's user-assigned managed identity. No secrets live in templates or outputs.
param location string
param namePrefix string
param tags object
param tenantId string = subscription().tenantId
@description('Principal ID of the user-assigned managed identity granted secret reads.')
param appIdentityPrincipalId string

@secure()
param databaseUrl string
@secure()
param azureMapsKey string = ''
@secure()
@description('Auth.js session secret (AUTH_SECRET). Empty defers sign-in setup.')
param authSecret string = ''
@secure()
@description('Entra External ID app client secret. Empty defers sign-in setup.')
param entraClientSecret string = ''

var kvName = take(toLower(replace('${namePrefix}-kv', '--', '-')), 24)

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  tags: tags
  properties: {
    tenantId: tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'database-url'
  properties: {
    value: databaseUrl
  }
}

resource mapsKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(azureMapsKey)) {
  parent: kv
  name: 'azure-maps-key'
  properties: {
    value: azureMapsKey
  }
}

resource authSecretRes 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(authSecret)) {
  parent: kv
  name: 'auth-secret'
  properties: {
    value: authSecret
  }
}

resource entraClientSecretRes 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(entraClientSecret)) {
  parent: kv
  name: 'entra-client-secret'
  properties: {
    value: entraClientSecret
  }
}

// Key Vault Secrets User
var secretsUserRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '4633458b-17de-408a-b874-0445c86b69e6'
)

resource secretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(kv.id, appIdentityPrincipalId, secretsUserRoleId)
  scope: kv
  properties: {
    roleDefinitionId: secretsUserRoleId
    principalId: appIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output name string = kv.name
output uri string = kv.properties.vaultUri
output databaseUrlSecretUri string = '${kv.properties.vaultUri}secrets/database-url'
output authSecretUri string = '${kv.properties.vaultUri}secrets/auth-secret'
output entraClientSecretUri string = '${kv.properties.vaultUri}secrets/entra-client-secret'
