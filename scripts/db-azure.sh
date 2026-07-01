#!/usr/bin/env bash
set -euo pipefail

# db-azure.sh — connect to the La Feria CR *Azure* Postgres (dev by default) from your Mac.
#
# What it does:
#   1. Verifies you're logged in (`az login` / `az account show`).
#   2. Discovers the Postgres server (laferia-<env>-pg) and its resource group + Key Vault.
#   3. Pulls the connection string from Key Vault (secret: database-url).
#   4. Opens the server firewall for your *current public IP* for this session only, and
#      always removes that temporary rule on exit (even on Ctrl-C / error).
#   5. Runs the requested subcommand with DATABASE_URL set.
#
# Prerequisites: Azure CLI (`az`) logged in with access to the resource group. `studio` and
# `query` need Node/npm only (no psql). `psql` subcommand needs libpq (`brew install libpq`).
#
# Usage:
#   scripts/db-azure.sh studio                      # Prisma Studio GUI (browse + edit rows)
#   scripts/db-azure.sh query "SELECT ..."          # run one SQL statement (no psql needed)
#   scripts/db-azure.sh psql                         # interactive psql shell (needs psql)
#   scripts/db-azure.sh seed                          # (re)seed the 66 markets (idempotent)
#   scripts/db-azure.sh seed-admin                    # grant super_admin (SUPER_ADMIN_OID/EMAIL)
#   scripts/db-azure.sh url                           # print the connection string (secret!)
#
# Environment:
#   ENV=dev        target environment (default: dev).
#   ALLOW_PROD=1   required to target prod (guarded off by default — this is an MVP-0 dev tool).

ENV="${ENV:-dev}"
CMD="${1:-studio}"
shift || true

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

die() { echo "error: $*" >&2; exit 1; }

# --- Safety: never touch prod unless explicitly opted in -----------------------------------
if [[ "$ENV" == "prod" && "${ALLOW_PROD:-0}" != "1" ]]; then
  die "ENV=prod is guarded. Re-run with ALLOW_PROD=1 if you really mean prod."
fi

command -v az >/dev/null 2>&1 || die "Azure CLI (az) not found. Install it, then 'az login'."
az account show >/dev/null 2>&1 || die "Not logged in to Azure. Run 'az login' first."

PG_NAME="laferia-${ENV}-pg"

echo "› Locating Postgres server '${PG_NAME}'…"
RG="$(az postgres flexible-server list --query "[?name=='${PG_NAME}'].resourceGroup | [0]" -o tsv)"
[[ -n "$RG" ]] || die "Couldn't find server '${PG_NAME}' in the current subscription.
       Check 'az account show' (right subscription?) and your access."

KV_NAME="$(az keyvault list -g "$RG" --query "[0].name" -o tsv)"
[[ -n "$KV_NAME" ]] || die "No Key Vault found in resource group '${RG}'."

echo "› Reading connection string from Key Vault '${KV_NAME}'…"
DATABASE_URL="$(az keyvault secret show --vault-name "$KV_NAME" --name database-url --query value -o tsv)"
[[ -n "$DATABASE_URL" ]] || die "Secret 'database-url' is empty or inaccessible in '${KV_NAME}'."
export DATABASE_URL

# --- Firewall: allow this machine's public IP for the session, then clean up ----------------
MY_IP="$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me || true)"
[[ -n "$MY_IP" ]] || die "Couldn't determine your public IP (needed for the DB firewall rule)."
RULE_NAME="mac-local-$(date +%s)"

cleanup() {
  az postgres flexible-server firewall-rule delete \
    --resource-group "$RG" --server-name "$PG_NAME" --name "$RULE_NAME" --yes \
    >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "› Opening firewall for ${MY_IP} (rule: ${RULE_NAME}, removed on exit)…"
az postgres flexible-server firewall-rule create \
  --resource-group "$RG" --server-name "$PG_NAME" --name "$RULE_NAME" \
  --start-ip-address "$MY_IP" --end-ip-address "$MY_IP" >/dev/null

echo "› Connected to ${ENV} (${PG_NAME}). Running: ${CMD}"
echo

case "$CMD" in
  studio)
    npm run db:studio
    ;;
  query)
    [[ $# -gt 0 ]] || die 'Provide SQL, e.g. scripts/db-azure.sh query "SELECT * FROM user_roles"'
    node scripts/db-query.mjs "$@"
    ;;
  psql)
    command -v psql >/dev/null 2>&1 || die "psql not found. Install with 'brew install libpq' (and add it to PATH), or use the 'query'/'studio' subcommands instead."
    psql "$DATABASE_URL" "$@"
    ;;
  seed)
    npm run db:seed
    ;;
  seed-admin)
    npm run db:seed:admin
    ;;
  url)
    echo "$DATABASE_URL"
    ;;
  *)
    die "Unknown command '${CMD}'. Use: studio | query | psql | seed | seed-admin | url"
    ;;
esac
