// Container Apps environment + app. Uses a user-assigned identity for ACR pull and to
// read the DATABASE_URL secret from Key Vault. Scales to zero by default.
param location string
param namePrefix string
param tags object
param logAnalyticsName string
param acrLoginServer string
param appIdentityId string
param containerImage string
param databaseUrlSecretUri string
param appInsightsConnectionString string
param dataSource string = 'db'
@description('Azure Maps account unique client id (sent to the browser SDK for Entra ID auth).')
param mapsClientId string = ''
@description('App managed identity client id, so DefaultAzureCredential selects the right UAMI.')
param managedIdentityClientId string = ''
@description('Key Vault secret URI for AUTH_SECRET; empty omits the sign-in secret.')
param authSecretUri string = ''
@description('Key Vault secret URI for the Entra client secret; empty omits it.')
param entraClientSecretUri string = ''
@description('Entra External ID app (client) id for sign-in.')
param entraClientId string = ''
@description('Entra External ID (CIAM) OIDC issuer/authority URL.')
param entraIssuer string = ''
param targetPort int = 3000
param minReplicas int = 0
param maxReplicas int = 5
param cpu string = '0.5'
param memory string = '1Gi'

resource law 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsName
}

// Sign-in secrets/env are added only when the Entra External ID setup has been done,
// so the app still provisions before auth is configured (login is optional in Phase 2).
var authSecretDefs = concat(
  empty(authSecretUri)
    ? []
    : [
        {
          name: 'auth-secret'
          keyVaultUrl: authSecretUri
          identity: appIdentityId
        }
      ],
  empty(entraClientSecretUri)
    ? []
    : [
        {
          name: 'entra-client-secret'
          keyVaultUrl: entraClientSecretUri
          identity: appIdentityId
        }
      ]
)

var secretDefs = concat(
  [
    {
      name: 'database-url'
      keyVaultUrl: databaseUrlSecretUri
      identity: appIdentityId
    }
  ],
  authSecretDefs
)

var baseEnv = [
  {
    name: 'DATA_SOURCE'
    value: dataSource
  }
  {
    name: 'DATABASE_URL'
    secretRef: 'database-url'
  }
  {
    name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
    value: appInsightsConnectionString
  }
  {
    name: 'AZURE_MAPS_CLIENT_ID'
    value: mapsClientId
  }
  {
    name: 'AZURE_MANAGED_IDENTITY_CLIENT_ID'
    value: managedIdentityClientId
  }
  {
    name: 'AUTH_MICROSOFT_ENTRA_ID_ID'
    value: entraClientId
  }
  {
    name: 'AUTH_MICROSOFT_ENTRA_ID_ISSUER'
    value: entraIssuer
  }
  {
    name: 'PORT'
    value: string(targetPort)
  }
  {
    name: 'HOSTNAME'
    value: '0.0.0.0'
  }
]

var authEnv = concat(
  empty(authSecretUri)
    ? []
    : [
        {
          name: 'AUTH_SECRET'
          secretRef: 'auth-secret'
        }
      ],
  empty(entraClientSecretUri)
    ? []
    : [
        {
          name: 'AUTH_MICROSOFT_ENTRA_ID_SECRET'
          secretRef: 'entra-client-secret'
        }
      ]
)

var containerEnv = concat(baseEnv, authEnv)

resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-cae'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: law.properties.customerId
        sharedKey: law.listKeys().primarySharedKey
      }
    }
  }
}

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${namePrefix}-app'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${appIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          identity: appIdentityId
        }
      ]
      secrets: secretDefs
    }
    template: {
      containers: [
        {
          name: 'web'
          image: containerImage
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: containerEnv
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: targetPort
              }
              initialDelaySeconds: 5
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: targetPort
              }
              initialDelaySeconds: 3
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-concurrency'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output appName string = app.name
output appFqdn string = app.properties.configuration.ingress.fqdn
