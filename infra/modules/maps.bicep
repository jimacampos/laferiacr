// Azure Maps account. Display wiring lands in Phase 2; the key is stashed in Key Vault now.
param location string = 'global'
param namePrefix string
param tags object

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

output name string = maps.name
#disable-next-line outputs-should-not-contain-secrets
output primaryKey string = maps.listKeys().primaryKey
