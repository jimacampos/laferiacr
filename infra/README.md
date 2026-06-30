# Infrastructure (Bicep) — La Feria CR

Phase 1 Azure platform as code. See [../docs/architecture/infrastructure.md](../docs/architecture/infrastructure.md)
and ADRs [0003](../docs/decisions/0003-compute-azure-container-apps.md) /
[0004](../docs/decisions/0004-database-postgresql-flexible.md).

## What it provisions
`main.bicep` (resource-group scoped) wires together:
- **User-assigned managed identity** — used for ACR pull and Key Vault secret reads.
- **Log Analytics + Application Insights** (`modules/monitoring.bicep`) — sampling + daily cap.
- **Container Registry** (Basic, `modules/registry.bicep`) — with AcrPull for the identity.
- **PostgreSQL Flexible Server** (Burstable B1ms) + database + PostGIS allowlist (`modules/postgres.bicep`).
- **Azure Maps** account (`modules/maps.bicep`) — key stashed in Key Vault for Phase 2.
- **Key Vault** (RBAC, `modules/keyvault.bicep`) — holds `database-url` (and `azure-maps-key`).
- **Container Apps** environment + app (`modules/containerapp.bicep`) — scale-to-zero (prod pins 1),
  `/api/health` probes, `DATABASE_URL` sourced from Key Vault, `DATA_SOURCE=db`.

## Prerequisites (operator)
- Azure subscription(s); a resource group per environment (e.g. `laferia-dev`, `laferia-prod`).
- OIDC federated credentials for the CD workflow (no long-lived secrets).
- `PG_ADMIN_PASSWORD` and `CONTAINER_IMAGE` provided at deploy time via environment variables.

## Validate / deploy
```bash
# Compile
az bicep build --file infra/main.bicep

# Preview against dev
PG_ADMIN_PASSWORD='<strong-password>' \
  az deployment group what-if -g laferia-dev -f infra/main.bicep -p infra/dev.bicepparam

# Deploy dev, then prod
PG_ADMIN_PASSWORD='<strong-password>' \
  az deployment group create -g laferia-dev -f infra/main.bicep -p infra/dev.bicepparam
```

In normal operation the **CD workflow** (`.github/workflows/cd.yml`) runs deploy → build/push image →
deploy revision → `prisma migrate deploy` → smoke test. The first deploy creates the app on a
placeholder image; the subsequent step swaps in the freshly built image.

> Secrets never live in templates, params, or outputs. The `database-url` is composed inside Bicep and
> written straight to Key Vault.
