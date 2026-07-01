using 'main.bicep'

// Prod environment: pin one replica to avoid cold starts. Secrets and the built image
// are supplied at deploy time via environment variables (no secrets in source control).
// Region defaults to centralus (known-good quota on this subscription); override with AZURE_LOCATION.

param environmentName = 'prod'
param namePrefix = 'laferia-prod'
param location = readEnvironmentVariable('AZURE_LOCATION', 'centralus')
param minReplicas = 1
param postgresAdminLogin = 'pgadmin'
param postgresAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD')
param containerImage = readEnvironmentVariable('CONTAINER_IMAGE', 'mcr.microsoft.com/k8se/quickstart:latest')
