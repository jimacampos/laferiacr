using 'main.bicep'

// Dev environment: smallest SKUs, scale to zero. Secrets and the built image are
// supplied at deploy time via environment variables (no secrets in source control).
// Region defaults to centralus — a region confirmed to have quota on this subscription
// (Visual Studio Enterprise subs have 0 App Service VM quota in many regions; Container
// Apps uses a different quota model but centralus is known-good). Override with AZURE_LOCATION.

param environmentName = 'dev'
param namePrefix = 'laferia-dev'
param location = readEnvironmentVariable('AZURE_LOCATION', 'centralus')
param minReplicas = 0
param postgresAdminLogin = 'pgadmin'
param postgresAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD')
param containerImage = readEnvironmentVariable('CONTAINER_IMAGE', 'mcr.microsoft.com/k8se/quickstart:latest')
