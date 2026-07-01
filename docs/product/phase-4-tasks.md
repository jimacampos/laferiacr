# Phase 4 — Task List: Roles, permissions & moderation

**Status:** 🟡 Planned · _Last updated: 2026-07-01_

Concrete, checkable tasks to execute **Phase 4** of the [roadmap](roadmap.md): real, audited
**governance** to replace the Phase 3 break-glass. This lands full RBAC, a moderation **reports queue**,
Community-Safety tooling (removal, hide/disable, **temp-bans**), Super-Admin tooling (manage roles,
configure **N**, override/revert), the deferred **`moderation_actions`** audit table, and the first actual
**admin/moderation UI**. Reference docs:
[overview](../architecture/overview.md) · [data-model](../architecture/data-model.md) ·
[moderation-trust](../architecture/moderation-trust.md) · [rbac](../architecture/rbac.md) ·
[security-privacy](../architecture/security-privacy.md) ·
ADRs [0008](../decisions/0008-promotion-automated-confirmation-and-roles.md),
[0013](../decisions/0013-minimal-roles-phase-3-break-glass.md),
0014 (full RBAC + moderation, new), 0015 (admin-configurable settings, new). PRD: FR-20…FR-22.

> **Definition of done (exit criteria):** **moderators and admins can keep content safe with audited,
> reversible actions.** Concretely: all four roles (**Member / Trusted / Community Safety / Super Admin**)
> resolve **server-side from the DB** and gate every mutating route; **Community Safety** can work a
> **reports queue**, remove/hide content, hide/disable a market, and **temp-ban** an abuser; **Super Admin**
> can **override/revert** fields, **grant/revoke** roles, and **configure N** from the database; every
> privileged action is written to the new **`moderation_actions`** audit table (field changes still logged in
> `change_history` for revert); a working **`/admin`** UI plus inline mod controls exist; **active bans block
> all writes**; `lint`/`test`/`build` are green and the migration compiles.

> **Scope note.** MVP 0 targets the **dev** environment only — prod is deferred. All in-repo artifacts
> (Prisma models + migration, API route handlers, authz/moderation/ban logic, admin UI/i18n, ADRs, doc
> updates) are authored and validated locally (`lint`/`test`/`build` green, migration compiles). New authz,
> ban, and config-precedence logic are covered by **Vitest** unit tests (`npm test`, wired into CI). Unchecked
> items are **operator follow-ups** requiring a live dev deploy, `prisma migrate deploy`, or seeding.

## Decisions locked (see plan)
- **Roles:** all four enforced; **Trusted is a manual-grant marker with no new powers** (reputation
  auto-grant stays Phase 6 — BL-006 / OQ-002).
- **Granting:** **manual only** — Super Admin grants Trusted + Community Safety (no reputation path yet).
- **Temp-bans:** new **`user_bans`** table; active ban **blocks all writes**; durations **1d / 7d / 30d /
  permanent**; **server-side enforced**; early lift supported.
- **Regional scoping (OQ-003):** **deferred** — keep `user_roles.scope`, grant global for now.
- **Auto-quarantine (OQ-009):** **not in Phase 4** — queue sorts by open-report count; mods act manually.
- **Threshold N:** moves to a DB **`app_config`** key/value store; resolver order **DB → env → default 2**.
- **UI:** dedicated **`/admin`** area (queue, roles, settings, audit) + inline controls on market detail.
- **ADRs:** **ADR-0014** (RBAC + moderation queue + `moderation_actions` + temp-bans), **ADR-0015**
  (admin-configurable settings via `app_config`).

## 0. Prep
- [ ] Create a tracking issue/epic and link this file.
- [ ] Confirm the four role strings + additive rank (`member` < `trusted` < `community_safety` <
  `super_admin`) and the capability list match [rbac](../architecture/rbac.md).
- [ ] Confirm ban duration presets (1d / 7d / 30d / permanent) and the DB config keys (`confirmation_threshold`).

## 1. Data model & migration
- [ ] Prisma models + **hand-authored SQL migration** (Phase 1/2 style; applied via `prisma migrate deploy`):
  - [ ] **`ModerationAction`** (`moderation_actions`): `id, actor_id, action, target_type, target_id?,
    reason?, metadata jsonb?, created_at`. Deferred in Phase 3 — now the primary moderator audit.
  - [ ] **`UserBan`** (`user_bans`): `id, user_id, reason?, created_by?, created_at, expires_at?,
    lifted_at?, lifted_by?` (permanent = `expires_at NULL`; active = not lifted and unexpired).
  - [ ] **`AppConfig`** (`app_config`): `key PK, value, updated_at, updated_by?`.
- [ ] FKs: `moderation_actions.actor_id → users(SET NULL)`; `user_bans.user_id → users(CASCADE)`,
  `created_by`/`lifted_by → users(SET NULL)`; `app_config.updated_by → users(SET NULL)`.
- [ ] Indexes: `moderation_actions (target_type, target_id)`, `(actor_id)`, `(created_at)`;
  `user_bans (user_id, expires_at)`; `reports (status, created_at)` for queue listing.
- [ ] `prisma generate`; regenerate the client in `generated/prisma`.
- [ ] Seed `app_config.confirmation_threshold = 2` (idempotent; extend the seed or `db:seed:admin` pattern).

## 2. Authorization layer (server-side, DB-backed)
- [ ] Extend `src/lib/contributions/roles.ts`: `getUserRoles(userId)`, `hasRole(userId, role)`, additive
  **role rank**, a **capability map** mirroring the [rbac](../architecture/rbac.md) matrix
  (`view_queue, resolve_reports, remove_content, hide_market, ban_user, override_field, revert,
  manage_roles, configure_policy, view_audit`), and `can(userId, capability)`; keep `isSuperAdmin`.
- [ ] Route guards (consistent JSON errors): `requireCapability(cap)` / `requireModerator()` /
  `requireSuperAdmin()` returning `{ userId }` or a `NextResponse` error.
- [ ] **Ban enforcement:** `activeBan(userId)` helper + guard wired into every write route (propose,
  confirm/reject, report, admin) → **403 `banned`**.
- [ ] **N resolver:** `resolveConfirmationThreshold()` (async: **DB `app_config` → env
  `CONFIRMATION_THRESHOLD` → default 2**); keep the pure sync `confirmationThreshold()` as the fallback.
  Update callers (`voting.ts` `castVote`, `proposals.ts` `getMarketContributions`).

## 3. Moderation APIs (Community Safety + Super Admin)
- [ ] **Reports queue:** `GET /api/admin/reports` — open reports **grouped by target**, enriched (target
  summary, count, latest reason), **sorted by count desc**, paginated. Capability `view_queue`.
- [ ] `POST /api/admin/reports/[id]` — `resolve` | `dismiss` (optional reason); option to resolve all open
  reports for the same target. Writes `moderation_actions`.
- [ ] **Content removal:** `POST /api/admin/proposals/[id]` — `remove` a proposal (status → rejected/hidden;
  recount is unaffected). Writes `moderation_actions`.
- [ ] **Markets:** extend `POST /api/admin/markets/[slug]` — **broaden `hide`/`unhide` to Community
  Safety**; keep `override`/`revert` Super-Admin-only; thread an optional `reason`.
- [ ] Refactor `admin.ts` (`overrideField`/`revertField`/`setMarketHidden`) to **dual-write
  `moderation_actions`** (actor + reason + metadata) alongside the existing `change_history` entries.

## 4. Super-Admin APIs (roles, bans, config, audit)
- [ ] **Roles:** `GET /api/admin/users?query=&page=` (paginated list, 10/page; lookup by email / oid /
  display name); `POST /api/admin/roles` — `grant` | `revoke` (userId, role, scope=null). **Guard: cannot revoke the last
  `super_admin`.** Writes `moderation_actions`. Capability `manage_roles`.
- [ ] **Temp-bans:** `POST /api/admin/bans` (userId, duration preset|permanent → `expires_at`, reason);
  `POST /api/admin/bans/[id]` to **lift early**. Capability `ban_user`. Writes `moderation_actions`.
- [ ] **Config:** `GET /api/admin/config` + `POST /api/admin/config` (update `confirmation_threshold` and
  future policy; validated: positive int for N). Capability `configure_policy`. Writes `moderation_actions`.
- [ ] **Audit log:** `GET /api/admin/audit` — list `moderation_actions` (filter by actor/target/action,
  paginated). Capability `view_audit`.

## 5. Admin & moderation UI (bilingual ES/EN)
- [ ] **`/admin` layout** — server-guarded by capability (redirect/403 for non-mods) + a dashboard linking
  the sub-areas; entry point in `Header` shown only to mods/admins.
- [ ] **`/admin/reports`** — the moderation **queue**: targets by open-report count, drill-in to the
  market/proposal, and actions (resolve/dismiss, hide market, remove proposal, ban author).
- [ ] **`/admin/roles`** _(Super Admin)_ — search a user; **grant/revoke** Trusted / Community Safety /
  Super Admin; shows current grants.
- [ ] **`/admin/settings`** _(Super Admin)_ — view/edit **N** (and future policy) from `app_config`.
- [ ] **`/admin/audit`** — read-only audit view over `moderation_actions`.
- [ ] **Inline `AdminControls`** on `/market/[slug]` (role passed from the server): hide/unhide, remove a
  proposal, resolve reports; revert/override stay Super-Admin-only.
- [ ] i18n: add `admin.*`, `moderation.*`, `roles.*`, `ban.*`, `settings.*`, `audit.*` ES/EN strings to
  `src/i18n/dictionaries.ts` (Spanish default).

## 6. Ban enforcement & abuse controls
- [ ] Every anonymous/account write path checks `activeBan` for the signed-in user and returns **403
  `banned`** with a friendly bilingual message.
- [ ] Confirm the existing rate-limit + CAPTCHA seam still applies; bans are an **additional**, per-account
  control on top of per-IP limits.
- [ ] Ensure **no auto-quarantine** path exists (OQ-009 decision) — the queue only *surfaces* report counts.

## 7. Tests (Vitest, colocated)
- [ ] `roles.test.ts` — additive role rank + capability matrix (`can`) for each role incl. deny cases.
- [ ] `bans.test.ts` — active-ban computation across expiry / early-lift / permanent.
- [ ] `config.test.ts` — extend for **DB → env → default** N precedence (pure precedence helper).
- [ ] Pure helpers unit-tested: **last-super-admin** revoke guard; **queue aggregation** shaping.

## 8. Docs & ADRs
- [ ] New **ADR-0014** (full RBAC + moderation queue + `moderation_actions` + temp-bans) and **ADR-0015**
  (admin-configurable settings via `app_config`); add both to `docs/decisions/README.md`.
- [ ] Update `rbac.md` (four roles enforced; capability map; manual grant; scoping deferred; temp-bans;
  supersede the Phase 3 "only super_admin" note), `moderation-trust.md` (reports queue live; **OQ-009 —
  no auto-quarantine** rationale; temp-ban mechanics), `data-model.md` (`moderation_actions` implemented +
  `metadata` refinement; new `user_bans`, `app_config`; reports queue index), `security-privacy.md` (ban
  enforcement; audit now via `moderation_actions`), `overview.md` (moderation flow "as implemented").
- [ ] Update `roadmap.md` (Phase 4 → in-progress/done as work lands; ensure Phase 3 reads done/deployed)
  and `prd.md` (FR-20…FR-22 status; Governance status row Planned → In progress).
- [ ] `backlog.md`: **park OQ-009** (decided: no auto-quarantine in Phase 4) and **OQ-003** (scoping
  deferred) with notes; cross-link **OQ-010** (appeals → content-guidelines); note **BL-014** relation.
- [ ] Run the **`docs-check`** skill; reconcile any missed docs.

## 9. Verify & deploy (dev only)
- [ ] `npm run lint` + `npm run build` clean; new authz/ban/config logic covered by focused tests (`npm test`).
- [ ] Migration applies on dev (`prisma migrate deploy`); `app_config` seeded; grant a test Community-Safety
  account.
- [ ] **Manual smoke on dev:** grant Community Safety → work the queue (resolve/dismiss, hide a market,
  remove a proposal) → grant/revoke a role as Super Admin → change **N** in settings and confirm promotion
  math follows → **ban** a test account and confirm its writes are blocked, then **lift** → verify every
  action appears in the audit log and (for field changes) is still **revertible**.
- [ ] Confirm App Insights receives moderation traces; no regressions to v0 browse/detail or the Phase 3
  contribution loop.

## Operator follow-ups (require live dev / portal)
- [ ] Deploy to **dev**; run `prisma migrate deploy`; seed `app_config`; appoint at least one Community
  Safety moderator via the roles UI/API.
- [ ] Smoke-test the full queue → action → audit loop on dev with two accounts (a moderator and a target).

---
_Tip: run the **`start-phase`** skill to auto-load these tasks into the session's todo list and create a
branch._
