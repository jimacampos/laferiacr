# ADR-0014: Full RBAC, moderation queue, `moderation_actions`, and temp-bans (Phase 4)

**Status:** 🟢 Accepted
**Date:** 2026-07-01

## Context
Phase 3 shipped anonymous propose → account-gated confirm → auto-promotion guarded only by a
single **API-only break-glass `super_admin`** ([ADR-0013](0013-minimal-roles-phase-3-break-glass.md)).
That is enough to undo one bad promotion, but not to run a community safely: there is no way for
non-admin helpers to triage reports, no queue, no audit of *who did what and why* beyond field
diffs in `change_history`, and no way to stop a persistent abuser. The `reports` table only
**records** reports; the `moderation_actions` audit table was explicitly deferred here.

Forces: authorization must resolve **server-side from the database**, never from client claims;
we want to **extend** the Phase 3 foundation (`user_roles` is already in final shape, `castVote`
and the Prisma-7 driver adapter are stable) rather than rebuild it; the first moderation surface
should be simple and safe against false-report brigading; and everything is **MVP 0, dev-only**.

## Decision
Promote the deferred Phase 4 governance model, enforced entirely on the server:

- **Four additive roles** — `member` < `trusted` < `community_safety` < `super_admin`. `member`
  is implicit (never stored); a higher rank includes every lower rank's capabilities. `trusted`
  is a **manual-grant marker with no new powers** yet (reputation-based grants stay Phase 6).
  A pure, client-safe policy module (`rolesPolicy.ts`) maps each **capability** to a minimum
  role; `roles.ts`/`guards.ts` resolve held roles from `user_roles` and defer the decision to it.
- **Manual granting only** — a Super Admin grants/revokes `trusted` and `community_safety`
  (and `super_admin`) via a role-management API/UI. Revoking the **last** `super_admin` is refused.
- **Reports queue** — open `reports` grouped by target, ranked by open-report **count** then
  recency. There is **no auto-quarantine** (OQ-009 deferred): the queue only surfaces counts and
  moderators act manually, which is the safest default against coordinated false reports.
- **`moderation_actions` audit table** (now added) — every privileged action **dual-writes**
  here (`actor_id`, `action`, `target_type`, `target_id`, `reason`, `metadata`, `created_at`).
  `change_history` remains the field-value diff log that powers **revert**; `moderation_actions`
  is the governance "who/what/why" trail.
- **Temp-bans** — a new `user_bans` table; an **active ban blocks all writes** (propose,
  confirm/reject, report), enforced server-side on the write routes. Durations are presets
  (1d / 7d / 30d) or **permanent**; bans can be **lifted early**. Governance routes are *not*
  ban-gated, so a moderator cannot lock themselves out.
- **Capability split** — Community Safety handles abuse remediation (view queue, resolve reports,
  remove content, hide/unhide market, ban, revert, view audit); structural powers (direct field
  **override**, **manage roles**, **configure policy**) are Super-Admin only.
- **Admin UI** — a dedicated, server-guarded `/admin` area (dashboard, reports queue, roles,
  settings, audit) plus lightweight inline moderation controls on the market detail page. This
  replaces the Phase 3 API-only break-glass with a real, usable surface.

Regional scoping (OQ-003) is **deferred**: the `user_roles.scope` column stays, but all roles are
granted globally for now. Admin-configurable N is covered by
[ADR-0015](0015-admin-configurable-settings-app-config.md).

## Consequences
- **Positive:** moderators and admins can keep content safe with **audited, reversible** actions;
  every privileged action is attributable via `moderation_actions`.
- **Positive:** `user_roles` needed no migration — Phase 4 extends the Phase 3 shape, exactly as
  [ADR-0013](0013-minimal-roles-phase-3-break-glass.md) intended.
- **Positive:** the pure/DB split (`rolesPolicy.ts` vs `roles.ts`, `bansPolicy.ts` vs `bans.ts`)
  keeps the capability matrix unit-tested and safe to import from client components.
- **Negative:** no reputation/auto-grant, no regional scoping, and no auto-quarantine yet — these
  are deferred to later phases (BL-006/OQ-002, OQ-003, OQ-009), so some manual toil remains.
- **Neutral:** dual-writing `change_history` **and** `moderation_actions` is mild redundancy, but
  each serves a distinct purpose (field diffs for revert vs. governance audit) and the write is
  transactional.
- **Neutral:** appeals (OQ-010) are out of scope; the audit trail is the current recourse record.
