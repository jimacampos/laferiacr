# Roles & Permissions (RBAC) — La Feria CR

**Status:** 🟢 Implemented (Phase 4) · _Last updated: 2026-07-01_

Authorization model: who can do what, and how it's enforced. Full RBAC landed in **Phase 4**
([ADR-0014](../decisions/0014-rbac-moderation-queue-and-temp-bans.md)); Phase 3 introduced a
minimal `user_roles` table and `super_admin` role early for break-glass admin
([ADR-0013](../decisions/0013-minimal-roles-phase-3-break-glass.md)).
Identity is provided by Entra External ID
([ADR-0005](../decisions/0005-identity-entra-external-id.md)); roles are stored in `user_roles`
([data-model](data-model.md)).

## Role hierarchy

```mermaid
flowchart LR
  A[Anonymous] --> M[Member]
  M --> T[Trusted]
  T --> CS[Community Safety]
  CS --> SA[Super Admin]
  M -.backlog.-> ST[Market Steward]
```

| Role | Who | Gets it by |
| --- | --- | --- |
| **Anonymous** | Any visitor | No sign-in |
| **Member** | Signed-in user | Signing in (Entra) |
| **Trusted** | Proven good contributor | Auto by reputation (Phase 6) or grant |
| **Community Safety** | Moderator | Appointed by Super Admin |
| **Super Admin** | Platform owner/operator | Bootstrapped; granted by Super Admin |
| **Market Steward** _(backlog)_ | Organizer/vendor for a market | Verified claim (Phase 8) |

Roles are **additive** — higher roles include lower-role capabilities.

## Capability matrix

| Capability | Anon | Member | Trusted | Community Safety | Super Admin |
| --- | :--: | :--: | :--: | :--: | :--: |
| Browse / search / view detail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Propose edit (hours/location) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit a new market | ✅ | ✅ | ✅ | ✅ | ✅ |
| Confirm / reject a proposal | ❌ | ✅ | ✅ | ✅ | ✅ |
| File a report | ✅ | ✅ | ✅ | ✅ | ✅ |
| Confirmation weight | — | 1× | 1× (Phase 6: higher) | 1× (Phase 6: higher) | 1× (Phase 6: higher) |
| View moderation queue | ❌ | ❌ | ❌ | ✅ | ✅ |
| Remove/hide content; resolve reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| Hide/disable a market | ❌ | ❌ | ❌ | ✅ | ✅ |
| Temp-ban a user | ❌ | ❌ | ❌ | ✅ | ✅ |
| Override field value directly | ❌ | ❌ | ❌ | ❌ | ✅ |
| Revert a change | ❌ | ❌ | ❌ | ✅* | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configure threshold **N** / policy | ❌ | ❌ | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ❌ | ✅ | ✅ |

\* Community Safety reverts are limited to abuse remediation; structural overrides are Super-Admin only.

> **Implementation note (Phase 4).** All four roles are active. A pure, client-safe policy module
> (`rolesPolicy.ts`) maps each capability to a **minimum role**; `roles.ts` resolves the caller's
> held roles from `user_roles` and `guards.ts` enforces per route. `trusted` is a manual-grant
> **marker with no new powers** yet (reputation-based grants are Phase 6). Regional `scope` is
> stored but not yet enforced (all grants are global). Community Safety handles abuse remediation;
> structural powers (direct override, manage roles, configure N) are Super-Admin only.

## Enforcement
- **Server-side only.** Every mutating API route re-checks the caller's role from a trusted source
  (DB-backed `user_roles`), never from client claims. UI hiding is convenience, not security.
- `can(userId, capability)` resolves held roles from the database and defers to the pure
  `rolesSatisfy` matrix in `rolesPolicy.ts`; route guards (`requireCapability`, `requireWriter`,
  `requireUser`) return the internal `user.id` or a JSON error. `isSuperAdmin(userId)` is retained
  for back-compat.
- **Ban-gating:** content-write guards (`requireWriter`) additionally refuse an **active-banned**
  user; governance guards (`requireCapability`) are *not* ban-gated, so a moderator can't lock
  themselves out.
- **Identity:** bearer token from Entra is validated per request; the app resolves the internal
  `user.id` and roles.
- **Least privilege & scope:** roles may carry a `scope` (e.g. region) so future moderators act only
  within their area (column present; enforcement deferred — OQ-003).
- **One-vote integrity:** confirmations are unique per `(proposal, user)`.
- **Audit:** Phase 3 privileged actions write `change_history`; Phase 4 moderation **dual-writes**
  `moderation_actions` (who/what/why) — see [data-model](data-model.md).

## Appointment & governance
- **Super Admin** is bootstrapped during setup with `npm run db:seed:admin`, keyed on
  `SUPER_ADMIN_OID` or `SUPER_ADMIN_EMAIL` and safe to re-run; when keyed by email it grants **every**
  `users` row for that address, so the grant survives duplicate identities
  ([ADR-0016](../decisions/0016-email-anchored-identity-resolution.md)). Additional admins are granted
  by an existing Super Admin.
- **Community Safety** moderators are appointed by a Super Admin; vetting criteria and optional
  regional scoping are an **open question** ([moderation-trust](moderation-trust.md)).
- **Trusted** is earned automatically via reputation in Phase 6 (or granted manually before then).
- Role changes are themselves audited.

## Open questions
- Vetting/onboarding for Community Safety; regional scoping rollout.
- Exact confirmation **weights** per role and when weighting turns on.
- Whether Trusted unlocks any moderation-lite capabilities (currently none).
