# Phase 3 — Task List: ⭐ Community contributions — hours + location

**Status:** ✅ Done — live on **dev** · _Last updated: 2026-07-01_

Concrete, checkable tasks to execute **Phase 3** of the [roadmap](roadmap.md): the core
**propose → confirm → verify** loop so the community can improve and verify real market **hours** and
**locations**. This is the **first community release**. Reference docs:
[overview](../architecture/overview.md) · [data-model](../architecture/data-model.md) ·
[moderation-trust](../architecture/moderation-trust.md) · [rbac](../architecture/rbac.md) ·
[security-privacy](../architecture/security-privacy.md) · [infrastructure](../architecture/infrastructure.md) ·
ADRs [0007](../decisions/0007-contribution-anonymous-propose-account-confirm.md),
[0008](../decisions/0008-promotion-automated-confirmation-and-roles.md),
0012 (anti-abuse, new), 0013 (minimal roles, new). PRD: FR-13…FR-18, NFR-10, NFR-11.

> **Definition of done (exit criteria):** the public can **improve and verify real hours/locations
> safely**. Concretely: anyone (anon) can propose **hours** and **location** (pin-drop / use-my-location);
> **signed-in** users can confirm/reject; at **N = 2 net confirmations** a proposal **auto-promotes** to
> the market's **verified** value with an updated timestamp, confirmation count, and a **verified** badge;
> competing proposals are shown as conflicts and **superseded** on promotion; anyone can **report**;
> anonymous writes are **rate-limited** (CAPTCHA seam present, flag-gated); every promotion is recorded
> in **reversible history**; a **break-glass admin** can revert/override/hide. Location pins begin
> populating `markets.location` so maps show real pins.

> **Scope note.** MVP 0 targets the **dev** environment only — prod is deferred. All in-repo artifacts
> (Prisma models + migration, API route handlers, promotion engine, UI/i18n, ADRs, doc updates) are
> authored and validated locally (`lint`/`test`/`build` green, migration compiles). The promotion rule
> and input validation are covered by **Vitest** unit tests (`npm test`, wired into CI). Unchecked items
> are **operator follow-ups** requiring a live dev deploy, `prisma migrate deploy`, seeding the
> super_admin, or CAPTCHA keys.

## Decisions locked (see plan)
- **N = 2**, **net** confirmations (confirms − rejects); stored as configurable policy (resolves OQ-001).
- **Anti-abuse:** durable **Postgres-backed per-IP rate limiting** now; **CAPTCHA integrated but
  flag-gated OFF** on dev until keys exist.
- **Confirmations:** the proposer's own vote **never counts**; promotion needs **N distinct confirmations
  from other accounts**; a signed-in proposer **cannot** confirm their own proposal.
- **Break-glass admin:** minimal **`user_roles`** table now + seed one **super_admin**.
- **Assumptions:** contributions **pseudonymous** (no public display names — OQ-008 stays open);
  hours stay **free text**; `moderation_actions` deferred to Phase 4 (break-glass audited via
  `change_history`).

## 0. Prep
- [x] Confirm **N = 2** as the seeded config default and where it lives (`CONFIRMATION_THRESHOLD` env,
  read server-side; documented as Super-Admin-configurable for Phase 4).
- [x] Decide CAPTCHA provider seam (provider-agnostic interface; e.g. Cloudflare Turnstile as the first
  adapter) and the `CAPTCHA_ENABLED` flag (default **off** on dev).
- [ ] Create a tracking issue/epic and link this file.

## 1. Data model & migration
- [x] Prisma models: **`Proposal`**, **`Confirmation`**, **`Report`**, **`ChangeHistory`**,
  **`UserRole`**, and a rate-limit log table — per [data-model](../architecture/data-model.md)
  (with the refinements in the plan: `confirm_count`/`reject_count`; `change_history.actor_id`+`action`).
- [x] Relations + constraints: `Confirmation` **UNIQUE (proposal_id, user_id)**; `UserRole`
  **UNIQUE (user_id, role, scope)**; FKs to `markets`/`users`; nullable `submitted_by`/`reported_by`
  (anonymous).
- [x] Indexes: `proposals(market_id, field, status)`, `proposals(submitted_by)`,
  `reports(target_type, target_id, status)`, rate-limit `(ip_hash, action, created_at)`.
- [x] Hand-authored SQL migration (mirrors Phase 1/2 style; PostGIS already enabled). `proposed_value`
  is `jsonb`; **no** geography column on proposals — location promotion converts `{lat,lng}` → geography
  via raw SQL.
- [x] `prisma generate`; regenerate the client in `generated/prisma`.
- [x] Seed helper for the **super_admin** `user_roles` row (idempotent; keyed on an operator `oid`/email
  from env), separate from the market seed.

## 2. Contribution APIs (write path)
- [x] `POST /api/markets/[slug]/proposals` — create a **hours** or **location** proposal. Anonymous
  allowed. Validates `field` + `proposed_value` (hours: non-empty, length-bounded string; location:
  `lat∈[-90,90]`, `lng∈[-180,180]` and within a Costa Rica bounding box). Applies **rate limit** +
  **CAPTCHA check** (when enabled). Returns 201 with the pending proposal (status `needs confirmation`).
- [x] `POST /api/proposals/[id]/confirm` and `.../reject` — **account required** (Auth.js `auth()`),
  one vote per user, **reject the proposer's own vote (403)**; insert `Confirmation`, recompute counts,
  run the **promotion engine** (section 3) in a transaction; return updated proposal/market state.
- [x] `POST /api/reports` — flag a `market` or `proposal` (anon allowed, rate-limited); status `open`.
- [x] Shared input validation (manual/lightweight — no new dep unless justified) and consistent JSON
  error shapes; all writes are server-side only.

## 3. Promotion engine
- [x] `promoteIfThresholdMet(proposalId)` in a DB **transaction**: compute **net = confirm − reject**;
  when `net >= N` set proposal `verified`, write the market field
  (`hours_text` directly; `location` via `ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography`), bump
  `markets.updated_at`, and append **`change_history`** (`action='promote'`, `caused_by_proposal`,
  old/new).
- [x] **Supersede** competing `pending`/`verified` proposals for the same `(market, field)` → status
  `superseded`.
- [x] **Reject** path: net-negative or explicit reject handling per
  [moderation-trust](../architecture/moderation-trust.md) (mark `rejected`; never silently promote).
- [x] Threshold **N** read from config (default 2); pure/unit-testable core.

## 4. Abuse controls (NFR-10 / NFR-11)
- [x] **Rate limiting:** durable Postgres per-IP fixed-window limiter on all anonymous writes
  (propose/report); hashed IP; prune old rows; returns 429 with a friendly message.
- [x] **CAPTCHA seam:** provider-agnostic verify step on anonymous writes, gated by `CAPTCHA_ENABLED`
  (default **off** on dev); wires client widget + server verification but is inert until keys are set.
- [x] **Route protection:** confirm/reject require a valid session; report-with-account optional; server
  re-checks identity (never client claims) — closes the Phase 2 "route protection lands in Phase 3" gap.
- [x] **Reversible history:** ensure every promoted change and every break-glass action writes
  `change_history` (NFR-11).

## 5. Read path, badges & conflicts
- [x] Extend `src/lib/markets.ts` (`getMarketBySlug`) to also return, per field: the current **verified**
  value + its **last-updated** + **confirmation count**, and any **pending** proposals (with counts)
  as **alternatives/conflicts**.
- [x] Derive **freshness/confidence**: `verified` (community-promoted, non-null value) vs
  **needs-confirmation** (pending only) vs **not-yet-contributed** (null hours/location).
- [x] Keep the static (`DATA_SOURCE!=db`) fallback compiling (no proposals in static mode).

## 6. Contribution UI (bilingual ES/EN)
- [x] **Suggest an edit — hours:** a form on `/market/[slug]` (client) to submit a free-text hours
  proposal; optimistic "needs confirmation" state + how many confirmations remain.
- [x] **Suggest an edit — location:** interactive **pin-drop** on the Azure Maps panel + **"use my
  location"** with **explicit, purpose-bound geolocation consent** (store the market coord, not user
  history — security-privacy); submit as a location proposal.
- [x] **Confirm / reject controls** (signed-in only; sign-in prompt otherwise); disabled on the user's
  own proposal.
- [x] **Badges & signals:** verified / needs-confirmation badges, confirmation counts, last-updated; and
  a **conflict view** ("2 say 5am, 1 says 6am") for competing proposals.
- [x] **Report** button on market + proposals.
- [x] i18n: add all `contribute.*`, `confirm.*`, `badge.*`, `report.*`, `geo.*` ES/EN strings to
  `src/i18n/dictionaries.ts` (Spanish default).

## 7. Break-glass admin (minimal)
- [x] Server-side `requireSuperAdmin()` helper resolving `user_roles` for the session user (DB-backed,
  never client claims).
- [x] Minimal admin actions, all **audited** via `change_history`: **revert** a promotion,
  **override** a field, **hide** a market/proposal (status change). No admin UI polish required —
  minimal, reversible break-glass only (full moderation queue is Phase 4).

## 8. Docs & ADRs
- [x] New **ADR-0012** (anti-abuse: Postgres rate limiting + CAPTCHA seam) and **ADR-0013** (minimal
  `user_roles` in Phase 3 for break-glass); add both to `docs/decisions/README.md` index.
- [x] Update `data-model.md` (implemented tables + refinements: two vote counters, `change_history`
  `actor_id`/`action`, rate-limit table, `user_roles` arriving in Phase 3), `moderation-trust.md`
  (N = 2 locked; self-vote rule), `security-privacy.md` (rate-limit store, IP hashing/retention,
  geolocation consent copy), `overview.md` (propose/confirm flows "as implemented"), `rbac.md`
  (super_admin seeded early), `prd.md` (FR-13…FR-18 / NFR-10 / NFR-11 status), `roadmap.md`
  (Phase 3 status).
- [x] `backlog.md`: mark **OQ-001** resolved (N = 2); note OQ-008 default (pseudonymous).
- [x] Run the **`docs-check`** skill; reconcile any missed docs.

## 9. Verify & deploy (dev only)
- [x] `npm run lint` + `npm run build` clean; promotion engine covered by focused tests.
- [x] Migration applies on dev (`prisma migrate deploy`); seed the **super_admin** row. _(Migrated via CD; super_admin seeded.)_
- [x] **Manual smoke on dev:** submit a location proposal (pin drop) → confirm with **two** different
  accounts → market auto-verifies and the **map shows a real pin**; repeat for hours; verify badges,
  counts, last-updated, conflict display, report, rate-limit 429, and a break-glass revert.
- [x] Confirm App Insights receives contribution traces; no regressions to v0 browse/detail.

## Operator follow-ups (require live dev / portal)
- [x] Deploy to **dev**; run `prisma migrate deploy`; seed the super_admin (operator `oid`).
- [ ] When enabling CAPTCHA: create the provider account, add keys to Key Vault + container-app env,
  flip `CAPTCHA_ENABLED=true` on dev. _(Deferred → [BL-016](backlog.md).)_
- [x] Smoke-test the full propose → confirm×2 → verify loop on dev. _(Verified — Atenas location promoted.)_

---
_Tip: run the **`start-phase`** skill to auto-load these tasks into the session's todo list and create a
branch._
