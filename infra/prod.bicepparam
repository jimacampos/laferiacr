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

// Sign-in (Phase 2, optional). Empty until the Entra External ID setup is done —
// see deploy/entra-external-id-setup.md. AUTH_SECRET + the Entra client secret land
// in Key Vault; the client id + issuer are plain container-app env vars.
param authSecret = readEnvironmentVariable('AUTH_SECRET', '')
param entraClientId = readEnvironmentVariable('AUTH_MICROSOFT_ENTRA_ID_ID', '')
param entraClientSecret = readEnvironmentVariable('AUTH_MICROSOFT_ENTRA_ID_SECRET', '')
param entraIssuer = readEnvironmentVariable('AUTH_MICROSOFT_ENTRA_ID_ISSUER', '')
