# Phase 2 — Task List: Accounts & market detail

**Status:** ✅ Done — live on **dev** · _Last updated: 2026-07-01_

Concrete, checkable tasks to execute **Phase 2** of the [roadmap](roadmap.md): give every market a
**detail page with a map** and add **optional sign-in**. Reference docs:
[overview](../architecture/overview.md) · [data-model](../architecture/data-model.md) ·
[security-privacy](../architecture/security-privacy.md) ·
[infrastructure](../architecture/infrastructure.md) · ADRs
[0005](../decisions/0005-identity-entra-external-id.md),
[0006](../decisions/0006-maps-azure-maps.md),
[0011](../decisions/0011-auth-library-authjs.md).

> **Definition of done (exit criteria):** users can sign in, and **every market has a detail page
> with a map**.

> **Scope note.** MVP 0 targets the **dev** environment only — prod is deferred. All in-repo artifacts
> (routes, components, Prisma migration, Bicep, ADRs, runbook) are authored and validated locally
> (`lint`/`build`/`bicep build` green). Unchecked items are **operator follow-ups** requiring the
> Entra admin center or a live dev deploy.

## 1. Market detail pages
- [x] DAL: `getMarketBySlug(slug)` in `src/lib/markets.ts` (static fallback + DB path with PostGIS
  `ST_Y`/`ST_X`).
- [x] Route `src/app/market/[slug]/page.tsx` (server, awaits `params`, `cache`d) + `not-found.tsx`.
- [x] `MarketDetailView` (client): hours/days/organizer/phones, provenance + freshness badges, bilingual.
- [x] Link market cards to their detail page (stretched link; tap-to-call preserved).
- [x] ES/EN strings for the detail page and map (`detail.*`, `map.*`).

## 2. Azure Maps
- [x] `MarketMap` client component (dynamic-import SDK in `useEffect`; pin when coords exist, else
  default Costa Rica view; degrades to "unavailable").
- [x] Server route `/api/maps/token` mints an Entra token via the app managed identity (no client key).
- [x] Bicep: grant the app identity **Azure Maps Data Reader**; output the Maps `clientId`; set
  `AZURE_MAPS_CLIENT_ID` + `AZURE_MANAGED_IDENTITY_CLIENT_ID` on the container app.
- [x] **Operator:** dev deploy so the Maps grant + client id ship and the map lights up live.
  _(Live on dev: `/api/maps/token` → 200 `{ clientId 1398fdf8… }`; detail pages render the map panel
  with the default Costa Rica view — pins arrive in Phase 3.)_

## 3. Accounts (Entra External ID + Auth.js)
- [x] `users` table (Prisma model + migration; `external_id` unique = token `oid`).
- [x] ADR-0011 — auth library choice (Auth.js / NextAuth v5).
- [x] `src/auth.ts`: `MicrosoftEntraID` provider, JWT sessions, `jwt` callback upserts `users`,
  `session` callback exposes `session.user.id`; `src/app/api/auth/[...nextauth]/route.ts`.
- [x] Header sign-in/out UI (`AuthStatus` + `SessionProvider`); `auth.*` ES/EN strings.
- [x] Env + infra: `.env.example` keys; Key Vault `auth-secret` / `entra-client-secret`; container-app
  env wiring; bicepparam + CD pass-through (all gated so the app runs before Entra is configured).
- [x] Operator runbook: [`deploy/entra-external-id-setup.md`](../../deploy/entra-external-id-setup.md).
- [x] **Operator:** create the External ID tenant + user flow (Google + email OTP) + app registration;
  set the `dev` GitHub env secrets/variables; re-run CD to enable sign-in.
  _(Live on dev: tenant `codelabslaferia` created; email-OTP user flow + app registration attached;
  the four `AUTH_*` GitHub env values set; sign-in verified end-to-end and a `users` row is upserted
  with `external_id` = the token `oid`. Google federation deferred to a follow-up.)_

## 4. Docs
- [x] Update `data-model.md` (users), `infrastructure.md` (auth + maps infra), `overview.md`
  (detail/maps/auth flow), `security-privacy.md` (JWT sessions, keyless maps), `prd.md` (FR-11/FR-12),
  `roadmap.md` (Phase 2 status); add ADR-0011 + implementation notes to ADR-0005/0006.

## Operator follow-ups (completed this session)
Entra External ID portal setup (tenant `codelabslaferia`, email-OTP user flow, app registration +
redirect URIs for the dev FQDN and `localhost`); populated the `dev` GitHub env auth secrets/variables;
dev deploy activated maps + sign-in; verified sign-in end-to-end and the `users` upsert. During
verification the callback URL resolved to `0.0.0.0:3000` behind the Container Apps ingress; fixed by
setting **`AUTH_URL`** (derived from the managed-environment `defaultDomain`) in
`infra/modules/containerapp.bicep` so it survives redeploys.

**Remaining (non-blocking):** add **Google** as an identity provider (Google Cloud OAuth client + Entra
config + add to the user flow) — tracked as a follow-up now that email OTP is proven.
