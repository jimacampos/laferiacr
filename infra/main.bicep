// La Feria CR — Phase 1 platform (resource-group scoped).
// Provisions: user-assigned identity, Log Analytics + App Insights, ACR, PostgreSQL
// Flexible (+PostGIS), Azure Maps, Key Vault, and the Container Apps environment + app.
//
// Validate:   az bicep build --file infra/main.bicep
// What-if:    az deployment group what-if -g <rg> -f infra/main.bicep -p infra/dev.bicepparam
// Deploy:     az deployment group create   -g <rg> -f infra/main.bicep -p infra/dev.bicepparam

targetScope = 'resourceGroup'

@description('Short environment name, e.g. dev or prod.')
param environmentName string

@description('Azure region for regional resources.')
param location string = resourceGroup().location

@description('Resource name prefix; keep short (used to derive ACR/Key Vault names).')
param namePrefix string = 'laferia-${environmentName}'

@description('Container image reference (overridden by CD per build).')
param containerImage string = 'mcr.microsoft.com/k8se/quickstart:latest'

@description('PostgreSQL administrator login.')
param postgresAdminLogin string = 'pgadmin'

@secure()
@description('PostgreSQL administrator password (supply at deploy time).')
param postgresAdminPassword string

@description('Postgres SKU name (Burstable B1ms by default).')
param postgresSkuName string = 'Standard_B1ms'

@description('Minimum Container App replicas (0 = scale to zero; pin 1 in prod to avoid cold starts).')
param minReplicas int = 0

@description('Database name.')
param databaseName string = 'laferiacr'

@secure()
@description('Auth.js session secret (AUTH_SECRET). Empty defers sign-in setup.')
param authSecret string = ''

@description('Entra External ID app (client) id for sign-in. Empty defers auth.')
param entraClientId string = ''

@secure()
@description('Entra External ID app client secret. Empty defers auth.')
param entraClientSecret string = ''

@description('Entra External ID (CIAM) OIDC issuer/authority URL. Empty defers auth.')
param entraIssuer string = ''

var tags = {
  app: 'laferiacr'
  env: environmentName
  managedBy: 'bicep'
}

resource appIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${namePrefix}-id'
  location: location
  tags: tags
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    namePrefix: namePrefix
    tags: tags
  }
}

module registry 'modules/registry.bicep' = {
  name: 'registry'
  params: {
    location: location
    namePrefix: namePrefix
    tags: tags
    appIdentityPrincipalId: appIdentity.properties.principalId
  }
}

module postgres 'modules/postgres.bicep' = {
  name: 'postgres'
  params: {
    location: location
    namePrefix: namePrefix
    tags: tags
    administratorLogin: postgresAdminLogin
    administratorPassword: postgresAdminPassword
    skuName: postgresSkuName
    databaseName: databaseName
  }
}

module maps 'modules/maps.bicep' = {
  name: 'maps'
  params: {
    namePrefix: namePrefix
    tags: tags
    appIdentityPrincipalId: appIdentity.properties.principalId
  }
}

var databaseUrl = 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgres.outputs.fqdn}:5432/${databaseName}?sslmode=require'

// Only wire the sign-in secret refs when the operator has supplied them; otherwise the
// container app would reference Key Vault secrets that were never created.
var authConfigured = !empty(authSecret)
var entraSecretConfigured = !empty(entraClientSecret)

module keyvault 'modules/keyvault.bicep' = {
  name: 'keyvault'
  params: {
    location: location
    namePrefix: namePrefix
    tags: tags
    appIdentityPrincipalId: appIdentity.properties.principalId
    databaseUrl: databaseUrl
    azureMapsKey: maps.outputs.primaryKey
    authSecret: authSecret
    entraClientSecret: entraClientSecret
  }
}

module containerApp 'modules/containerapp.bicep' = {
  name: 'containerApp'
  params: {
    location: location
    namePrefix: namePrefix
    tags: tags
    logAnalyticsName: monitoring.outputs.logAnalyticsName
    acrLoginServer: registry.outputs.loginServer
    appIdentityId: appIdentity.id
    containerImage: containerImage
    databaseUrlSecretUri: keyvault.outputs.databaseUrlSecretUri
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    minReplicas: minReplicas
    mapsClientId: maps.outputs.clientId
    managedIdentityClientId: appIdentity.properties.clientId
    authSecretUri: authConfigured ? keyvault.outputs.authSecretUri : ''
    entraClientSecretUri: entraSecretConfigured ? keyvault.outputs.entraClientSecretUri : ''
    entraClientId: entraClientId
    entraIssuer: entraIssuer
  }
}

output acrLoginServer string = registry.outputs.loginServer
output acrName string = registry.outputs.name
output keyVaultName string = keyvault.outputs.name
output postgresFqdn string = postgres.outputs.fqdn
output appFqdn string = containerApp.outputs.appFqdn
output appName string = containerApp.outputs.appName
