# Phase 1 — Task List: Backend foundation & data migration

**Status:** 🟡 Draft · _Last updated: 2026-06-30_

Concrete, checkable tasks to execute **Phase 1** of the [roadmap](roadmap.md): stand up the Azure
platform and move data into PostgreSQL **without changing the user experience**. Reference docs:
[infrastructure](../architecture/infrastructure.md) · [data-model](../architecture/data-model.md) ·
[overview](../architecture/overview.md) · ADRs
[0003](../decisions/0003-compute-azure-container-apps.md),
[0004](../decisions/0004-database-postgresql-flexible.md).

> **Definition of done (exit criteria):** the app behaves **exactly like v0**, but is DB-backed and
> deployed on Azure Container Apps, with CI/CD and seeded data. No visible UX change.

## 0. Prep
- [ ] Confirm Azure subscription(s) and naming/region (CR users → e.g. `eastus2`/`centralus`); decide dev/prod split.
- [ ] Choose ORM: **Prisma** or **Drizzle** (record as an ADR if it's a lasting decision).
- [ ] Create a tracking issue/epic and link this file.

## 1. Infrastructure as Code (Bicep)
- [ ] Scaffold `infra/` with `main.bicep` + `dev.bicepparam` / `prod.bicepparam`.
- [ ] Module: **Azure Container Registry** (Basic).
- [ ] Module: **Container Apps** environment + app (scale-to-zero; prod min-replica flag).
- [ ] Module: **PostgreSQL Flexible Server** (Burstable B1ms) + database + firewall; enable **PostGIS**.
- [ ] Module: **Key Vault** (+ access for app managed identity).
- [ ] Module: **Application Insights** / Log Analytics (with sampling).
- [ ] Module: **Azure Maps** account (key → Key Vault). _(display wiring lands in Phase 2)_
- [ ] Wire **managed identity** so the app reads secrets from Key Vault.
- [ ] `what-if` deploy to **dev**; review; deploy.

## 2. Containerize the app
- [ ] Add a production `Dockerfile` (Next.js standalone output) + `.dockerignore`.
- [ ] Configure `next.config.ts` `output: 'standalone'`.
- [ ] Add `/api/health` (readiness/liveness) route for ACA probes.
- [ ] Build & run the image locally; verify parity with `npm run dev`.

## 3. CI/CD (GitHub Actions)
- [ ] Configure **OIDC federated credentials** (no long-lived secrets).
- [ ] CI workflow: `npm ci` → `npm run lint` → `npm run build` on PRs.
- [ ] CD workflow: build image → push to ACR → deploy ACA revision → run migrations → smoke check.
- [ ] Add environment protection rules for **prod**.

## 4. Database schema & ORM
- [ ] Install/configure the chosen ORM; connect via Key Vault secret.
- [ ] Model **`markets`** first (the only table needed for v0 parity), per [data-model](../architecture/data-model.md).
  - [ ] Include `source`, `status`, `days` (jsonb), `hours_text`, `location` (PostGIS `geography`), `organizer`, `phone`, `updated_at`.
- [ ] Create the initial **migration**; enable the **PostGIS** extension in-migration.
- [ ] (Optional now) stub later tables (`proposals`, `confirmations`, …) only if cheap — otherwise defer to Phase 3.

## 5. Data seeding
- [ ] Write an **idempotent seed** that loads `src/data/ferias.json` into `markets` with `source='official'` (upsert by stable key).
- [ ] Reuse v0 **day-normalization** logic (`scripts/generate_data.py`) so `days` keys match the app.
- [ ] Run seed against dev; verify **66 markets**, 9 regions, correct day keys.

## 6. Read-path cutover
- [ ] Add a server-side data access layer querying `markets` (replacing the static `src/data/ferias.ts` import).
- [ ] Keep `src/lib/filters.ts` semantics identical (weekend = fri/sat/sun; "this weekend" default).
- [ ] Feature-flag or straight swap; ensure SSR still renders ES by default.

## 7. Verify parity & deploy
- [ ] `npm run lint` + `npm run build` clean.
- [ ] Manual parity check: home shows **"this weekend"** (64 of 66), filters, search, tap-to-call all work.
- [ ] Deploy to **dev**, smoke test; then **prod**.
- [ ] Confirm App Insights receives traces; alerts wired (error rate, DB CPU, **daily spend**).

## 8. Wrap-up
- [ ] Update [infrastructure](../architecture/infrastructure.md) with any SKU/decision changes.
- [ ] Run the **`docs-check`** skill; update docs/ADRs as needed.
- [ ] Record the ORM choice + any new decisions as ADR(s).
- [ ] Demo: v0 behavior, now on Azure + Postgres.

---
_Tip: run the **`start-phase`** skill to auto-load these tasks into the session's todo list and create a branch._
