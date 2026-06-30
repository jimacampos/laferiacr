using 'main.bicep'

// Prod environment: pin one replica to avoid cold starts. Secrets and the built image
// are supplied at deploy time via environment variables (no secrets in source control).

param environmentName = 'prod'
param namePrefix = 'laferia-prod'
param minReplicas = 1
param postgresAdminLogin = 'pgadmin'
param postgresAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD')
param containerImage = readEnvironmentVariable('CONTAINER_IMAGE', 'mcr.microsoft.com/k8se/quickstart:latest')
