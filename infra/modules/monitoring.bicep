// Log Analytics workspace + Application Insights (workspace-based) with sampling and
// a daily ingestion cap to control cost.
param location string
param namePrefix string
param tags object
param dailyQuotaGb int = 1
param retentionInDays int = 30
param samplingPercentage int = 50

resource law 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-law'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    workspaceCapping: {
      dailyQuotaGb: dailyQuotaGb
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-appi'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: law.id
    SamplingPercentage: samplingPercentage
  }
}

output logAnalyticsName string = law.name
output logAnalyticsId string = law.id
output appInsightsConnectionString string = appInsights.properties.ConnectionString
