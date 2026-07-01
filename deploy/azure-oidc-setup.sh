#!/usr/bin/env bash
#
# One-time GitHub OIDC (federated) identity setup for the "CD" workflow, per
# environment (dev/prod). Creates an Entra app registration + service principal,
# adds a federated credential whose subject is the GitHub *environment* (so
# azure/login works from a job that declares `environment: <env>`), ensures the
# target resource group exists, and grants the rights the workflow needs.
#
# Why these grants (learned the hard way on an earlier Azure rollout):
#   - A federated (OIDC) SP CANNOT `az acr login` (no refresh token → 401). The
#     workflow builds server-side with `az acr build`, which needs a role with
#     the ACR `scheduleRun` action — i.e. **Contributor**, not just AcrPush.
#     Granting Contributor on the whole resource group also covers the bicep
#     deploys, the Postgres firewall-rule dance, and `containerapp show`.
#   - The workflow reads the `database-url` secret from an RBAC-enabled Key
#     Vault, which needs the data-plane **Key Vault Secrets User** role
#     (Contributor alone does not grant secret *data* access).
#   - The bicep template *creates role assignments* (the app's user-assigned
#     identity gets AcrPull on the registry + Key Vault Secrets User on the
#     vault). Writing role assignments needs `Microsoft.Authorization/
#     roleAssignments/write`, which **Contributor explicitly excludes** — so the
#     deploy identity also needs **User Access Administrator** on the group, or
#     `az deployment group create` fails with "Authorization failed ... does not
#     have permission to perform action Microsoft.Authorization/roleAssignments/
#     write".
#
# Run once per environment. Requires the Azure CLI (`az login`) with permission
# to create app registrations and role assignments. Idempotent.
#
#   ENVIRONMENT=dev  ./deploy/azure-oidc-setup.sh
#   ENVIRONMENT=prod ./deploy/azure-oidc-setup.sh
set -euo pipefail

# ---- Configure these ------------------------------------------------------
GITHUB_REPO="${GITHUB_REPO:-jimacampos/laferiacr}"       # owner/repo
ENVIRONMENT="${ENVIRONMENT:-dev}"                        # dev | prod (GitHub environment name)
LOCATION="${LOCATION:-centralus}"                        # known-good quota on this subscription
RESOURCE_GROUP="${RESOURCE_GROUP:-laferia-${ENVIRONMENT}}"
APP_NAME="${APP_NAME:-laferiacr-github-deploy}"          # shared Entra app reg across environments
# ---------------------------------------------------------------------------

SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
TENANT_ID="$(az account show --query tenantId -o tsv)"

echo "==> Resource group ($RESOURCE_GROUP in $LOCATION)"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

echo "==> App registration ($APP_NAME) + service principal"
APP_ID="$(az ad app list --display-name "$APP_NAME" --query '[0].appId' -o tsv)"
if [ -z "$APP_ID" ]; then
  APP_ID="$(az ad app create --display-name "$APP_NAME" --query appId -o tsv)"
fi
az ad sp create --id "$APP_ID" --output none 2>/dev/null || true

echo "==> Federated credential for $GITHUB_REPO (environment: $ENVIRONMENT)"
# The CD workflow runs each job with `environment: <env>`, so the OIDC token
# subject is repo:<owner>/<repo>:environment:<env> — NOT a branch ref.
CRED_NAME="github-env-${ENVIRONMENT}"
if ! az ad app federated-credential list --id "$APP_ID" \
      --query "[?name=='${CRED_NAME}'] | [0].name" -o tsv | grep -q "$CRED_NAME"; then
  az ad app federated-credential create --id "$APP_ID" --parameters "{
    \"name\": \"${CRED_NAME}\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GITHUB_REPO}:environment:${ENVIRONMENT}\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" --output none
fi

echo "==> Role assignments on $RESOURCE_GROUP (Contributor + Key Vault Secrets User + User Access Administrator)"
RG_SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}"
# Contributor: bicep deploys, `az acr build` (needs scheduleRun), Postgres
# firewall rules, containerapp show.
az role assignment create --assignee "$APP_ID" --role "Contributor" \
  --scope "$RG_SCOPE" --output none 2>/dev/null || true
# Key Vault Secrets User: read the database-url secret before `prisma migrate deploy`.
az role assignment create --assignee "$APP_ID" --role "Key Vault Secrets User" \
  --scope "$RG_SCOPE" --output none 2>/dev/null || true
# User Access Administrator: the bicep template creates role assignments for the
# app's user-assigned identity (AcrPull + Key Vault Secrets User); Contributor
# cannot write role assignments, so the deploy identity needs this too.
az role assignment create --assignee "$APP_ID" --role "User Access Administrator" \
  --scope "$RG_SCOPE" --output none 2>/dev/null || true

cat <<EOF

Done for environment '$ENVIRONMENT'.

Set these GitHub *repo* Secrets (Settings -> Secrets and variables -> Actions):
  AZURE_CLIENT_ID       = $APP_ID
  AZURE_TENANT_ID       = $TENANT_ID
  AZURE_SUBSCRIPTION_ID = $SUBSCRIPTION_ID

Set these on the '$ENVIRONMENT' GitHub *Environment*
(Settings -> Environments -> $ENVIRONMENT):
  Variables:
    AZURE_RESOURCE_GROUP = $RESOURCE_GROUP
    AZURE_LOCATION       = $LOCATION      # optional; bicepparam defaults to centralus
  Secrets:
    PG_ADMIN_PASSWORD    = <strong password>

Re-run with ENVIRONMENT=prod to add the prod federated credential + grants.
For prod, also add a required-reviewers protection rule on the environment.
EOF
