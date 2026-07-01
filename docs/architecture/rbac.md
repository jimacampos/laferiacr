# Roles & Permissions (RBAC) — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-07-01_

Authorization model: who can do what, and how it's enforced. Full RBAC lands in **Phase 4**
([roadmap](../product/roadmap.md)); Phase 3 introduces a minimal `user_roles` table and
`super_admin` role early for break-glass admin ([ADR-0013](../decisions/0013-minimal-roles-phase-3-break-glass.md)).
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

> **Phase 3 implementation note.** Only `super_admin` is active. Minimal API-level break-glass actions
> support revert, override, and hide; each writes `change_history`. The full moderation queue,
> Community Safety role, regional scopes, and `moderation_actions` audit table remain Phase 4.

## Enforcement
- **Server-side only.** Every mutating API route re-checks the caller's role from a trusted source
  (DB-backed `user_roles`), never from client claims. UI hiding is convenience, not security.
- `isSuperAdmin(userId)` resolves `super_admin` from the database; it never trusts client claims.
- **Identity:** bearer token from Entra is validated per request; the app resolves the internal
  `user.id` and roles.
- **Least privilege & scope:** roles may carry a `scope` (e.g. region) so future moderators act only
  within their area.
- **One-vote integrity:** confirmations are unique per `(proposal, user)`.
- **Audit:** Phase 3 privileged actions write `change_history`; Phase 4 moderation also writes
  `moderation_actions` — see [data-model](data-model.md).

## Appointment & governance
- **Super Admin** is bootstrapped during setup with `npm run db:seed:admin`, keyed on
  `SUPER_ADMIN_OID` or `SUPER_ADMIN_EMAIL` and safe to re-run. Additional admins are granted by an
  existing Super Admin.
- **Community Safety** moderators are appointed by a Super Admin; vetting criteria and optional
  regional scoping are an **open question** ([moderation-trust](moderation-trust.md)).
- **Trusted** is earned automatically via reputation in Phase 6 (or granted manually before then).
- Role changes are themselves audited.

## Open questions
- Vetting/onboarding for Community Safety; regional scoping rollout.
- Exact confirmation **weights** per role and when weighting turns on.
- Whether Trusted unlocks any moderation-lite capabilities (currently none).
