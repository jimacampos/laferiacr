---
name: db-access
description: >
  Connect to the La Feria CR Azure Postgres (dev by default) from a Mac and view or edit data, using
  the repo's scripts/db-azure.sh helper. Use this skill whenever the user wants to look at or change
  database data, run a SQL query against the live dev/prod DB, open Prisma Studio, re-seed markets, or
  (re)grant super_admin. Triggers on: "connect to the database", "query the dev DB", "look at the users
  table", "check the data in Azure", "open Prisma Studio", "run this SQL against dev", "re-seed the
  markets", "grant super_admin", "how do I access the database again", "reset my admin role".
---

# Database Access — La Feria CR (Azure Postgres)

Remind the user how to reach the **Azure** Postgres (not a local copy) from their Mac and run common
tasks, via `scripts/db-azure.sh`. The script discovers the server + Key Vault, pulls the connection
string, opens the firewall for the caller's IP **for that run only** (auto-removed on exit), then runs
the requested subcommand with `DATABASE_URL` set.

## Prerequisites (state these first)
- **Azure CLI** logged in: `az login` (the script fails fast with a clear message if not).
- Access to the resource group / **Key Vault Secrets User** on `laferia-<env>-kv`.
- **Node/npm** — enough for `studio`, `query`, `seed`, `seed-admin`. Only the `psql` subcommand needs
  libpq (`brew install libpq`); everything else avoids psql entirely (`scripts/db-query.mjs` uses `pg`).

## Common commands
Run from the repo root. Default env is **dev**; the script is safe to re-run.

```bash
# Browse + edit rows in a GUI (Prisma Studio)
./scripts/db-azure.sh studio

# Run one SQL statement (no psql needed) — quote the whole statement
./scripts/db-azure.sh query "SELECT id, email FROM users ORDER BY created_at DESC LIMIT 20"

# Interactive psql shell (needs: brew install libpq)
./scripts/db-azure.sh psql

# (Re)seed the 66 markets — idempotent
./scripts/db-azure.sh seed

# Grant super_admin to an operator (see note below)
SUPER_ADMIN_EMAIL="you@example.com" ./scripts/db-azure.sh seed-admin

# Print the raw connection string (⚠️ secret — don't paste it anywhere)
./scripts/db-azure.sh url
```

## Handy queries
```bash
# All rows for one email + their roles (spot duplicate identities / missing grants)
./scripts/db-azure.sh query "SELECT u.id, u.external_id, u.created_at, r.role FROM users u LEFT JOIN user_roles r ON r.user_id=u.id WHERE u.email='you@example.com' ORDER BY u.created_at"

# Open reports queue depth
./scripts/db-azure.sh query "SELECT status, count(*) FROM reports GROUP BY status"
```

## Safety & gotchas
- **Prod is guarded.** `ENV=dev` is the default; targeting prod requires `ENV=prod ALLOW_PROD=1 …`.
  This is an MVP-0 dev tool — don't run it against prod unless the user is explicit and intentional.
- The firewall rule is **temporary** and removed on exit (even on Ctrl-C/error). If a run is force-killed,
  a stray rule `allow-<ip>-<ts>` may linger on `laferia-<env>-pg` — mention it can be removed in the portal.
- `seed-admin` grants `super_admin` to **every** `users` row matching the email (identities can fan out
  across sign-in methods — see [ADR-0016](../../../docs/decisions/0016-email-anchored-identity-resolution.md)).
- `url` prints a **live secret**; never echo it into logs, commits, or chat.

## Notes for the agent
- Prefer `query` for quick reads you can interpret inline; suggest `studio` when the user wants to
  browse/edit interactively.
- If discovery fails, the usual cause is the wrong Azure subscription — have them run `az account show`
  and, if needed, `az account set --subscription <id>`.
- These scripts live in `scripts/db-azure.sh` and `scripts/db-query.mjs`; point the user there for the
  full usage header.
