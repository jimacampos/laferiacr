// Azure Database for PostgreSQL Flexible Server (Burstable) + database, with the PostGIS
// extension allowlisted so `CREATE EXTENSION postgis` succeeds during migrations.
param location string
param namePrefix string
param tags object
param administratorLogin string
@secure()
param administratorPassword string
param skuName string = 'Standard_B1ms'
param skuTier string = 'Burstable'
param storageSizeGB int = 32
param postgresVersion string = '16'
param databaseName string = 'laferiacr'
@description('Open the server to other Azure services (0.0.0.0 firewall rule).')
param allowAzureServices bool = true

resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: '${namePrefix}-pg'
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    version: postgresVersion
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: pg
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allowlist PostGIS (Flexible Server requires extensions to be opted in before use).
resource extensionsAllowlist 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2024-08-01' = {
  parent: pg
  name: 'azure.extensions'
  properties: {
    value: 'POSTGIS'
    source: 'user-override'
  }
  dependsOn: [
    database
  ]
}

resource allowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = if (allowAzureServices) {
  parent: pg
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
  dependsOn: [
    extensionsAllowlist
  ]
}

output serverName string = pg.name
output fqdn string = pg.properties.fullyQualifiedDomainName
output databaseName string = databaseName
