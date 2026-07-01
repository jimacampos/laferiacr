# Deploying La Feria CR to Azure

Phase 1 runs the containerized Next.js app on **Azure Container Apps** (scale-to-zero)
with data in **PostgreSQL Flexible Server + PostGIS**. Infrastructure is **Bicep**
(`infra/`), and CI/CD is GitHub Actions (`.github/workflows/`). Auth to Azure uses
**GitHub OIDC** federated credentials — no long-lived cloud secrets.

```
GitHub Actions (OIDC) ─▶ az deployment group create (infra/main.bicep)
                       ─▶ az acr build  ─▶ deploy revision (Container Apps)
                       ─▶ prisma migrate deploy  ─▶ /api/health smoke test
```

See [`../infra/README.md`](../infra/README.md) for what the Bicep provisions and how to
deploy by hand.

## Subscription notes (this account)

- **Region:** default to **`centralus`**. On this subscription (Visual Studio Enterprise)
  App Service compute quota is 0 in several regions; Container Apps uses a different quota
  model, but `centralus` is a confirmed-good region — the bicepparams default to it
  (override with `AZURE_LOCATION`).
- **OIDC + ACR:** a federated service principal **cannot `az acr login`** (no refresh
  token). The CD workflow builds server-side with **`az acr build`**, which needs a role
  with the ACR `scheduleRun` action — **Contributor**, not `AcrPush`. The setup script
  grants Contributor at the resource-group scope.
- **Key Vault:** reading the `database-url` secret before migrations needs the data-plane
  **Key Vault Secrets User** role (Contributor alone is not enough on an RBAC vault).

## One-time setup

Install the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) and
`az login` first, then run **once per environment**:

```bash
ENVIRONMENT=dev  ./deploy/azure-oidc-setup.sh
ENVIRONMENT=prod ./deploy/azure-oidc-setup.sh
```

Each run: ensures the resource group exists (in `centralus`), creates/reuses the shared
Entra app registration, adds a federated credential whose subject is the GitHub
**environment** (`repo:jimacampos/laferiacr:environment:<env>` — matching the `environment:`
in `cd.yml`), and grants **Contributor** + **Key Vault Secrets User** on the resource group.

Then set the GitHub config the script prints:

- **Repo → Settings → Secrets and variables → Actions → Secrets:**
  `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- **Repo → Settings → Environments → `dev` / `prod`:**
  - Variables: `AZURE_RESOURCE_GROUP` (e.g. `laferia-dev`), optional `AZURE_LOCATION`
  - Secrets: `PG_ADMIN_PASSWORD`
- Add a **required reviewers** protection rule on the `prod` environment.

## Deploy

Push to `main` runs the **CD** workflow against `dev` (or run it manually and pick
`dev`/`prod`). The first run bootstraps the ACR on a placeholder image, then builds and
ships the real image, deploys the revision, runs `prisma migrate deploy` (temporarily
opening the Postgres firewall to the runner IP), and smoke-tests `/api/health`.

## Seed the data

`prisma migrate deploy` creates the schema; load the markets with the seed (idempotent,
upsert by `slug`) against the target database:

```bash
DATABASE_URL="$(az keyvault secret show --vault-name <kv> --name database-url --query value -o tsv)" \
  npm run db:seed
```

Expect **66 markets** across **9 regions**. The app serves this data when the Container
App's `DATA_SOURCE=db` (set by Bicep); locally it falls back to the static list.

## Gotchas (don't re-learn these)

1. **`az acr build`, not `az acr login`.** OIDC SPs have no refresh token; `az acr login`
   returns 401. Build server-side; grant **Contributor** on the ACR/resource group.
2. **Federated subject = environment, not branch.** Because `cd.yml` jobs declare
   `environment: <env>`, the credential subject must be
   `repo:<owner>/<repo>:environment:<env>`. A branch-ref subject will fail login.
3. **Key Vault secret reads need Key Vault Secrets User** (data plane) on an RBAC vault.
4. **Region quota.** If a region rejects the deploy for quota, try another; `centralus`
   is known-good here.
