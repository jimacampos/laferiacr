using 'main.bicep'

// Dev environment: smallest SKUs, scale to zero. Secrets and the built image are
// supplied at deploy time via environment variables (no secrets in source control).

param environmentName = 'dev'
param namePrefix = 'laferia-dev'
param minReplicas = 0
param postgresAdminLogin = 'pgadmin'
param postgresAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD')
param containerImage = readEnvironmentVariable('CONTAINER_IMAGE', 'mcr.microsoft.com/k8se/quickstart:latest')
