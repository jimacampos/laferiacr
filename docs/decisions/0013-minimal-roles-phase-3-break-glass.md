# ADR-0013: Minimal `user_roles` in Phase 3 for break-glass admin

**Status:** 🟢 Accepted
**Date:** 2026-07-01

## Context
Phase 3 auto-promotes community edits with **no human gate** (per
[ADR-0008](0008-promotion-automated-confirmation-and-roles.md)). The moment real data can change
automatically, the operator needs a way to **undo or correct** a bad promotion, and to **hide** an
abusive market/proposal — a break-glass safety valve. The full role-based moderation system (Community
Safety moderators, regional scopes, a moderation queue, `moderation_actions` audit table) is scoped to
**Phase 4** and is more than Phase 3 needs. But shipping anonymous auto-promotion with *no* privileged
override would be irresponsible.

Forces: we don't want to build all of RBAC early, but we need *one* trusted actor now; identity must be
resolved server-side from the database, never from client claims; whatever we add should be
forward-compatible with Phase 4's fuller model rather than a throwaway.

## Decision
Pull a **minimal subset** of the Phase 4 RBAC forward: introduce the `user_roles` table now
(`user_id`, `role`, optional `scope`, `granted_at`, `granted_by`; unique on `(user_id, role, scope)`)
but use only the **`super_admin`** role in Phase 3. A server-side `isSuperAdmin(userId)` helper resolves
the role from the DB. One super_admin is **seeded** via a dedicated, idempotent script
(`npm run db:seed:admin`) keyed on the operator's Entra `oid` (or email). Break-glass actions — **revert**
a promotion, **override** a field, **hide** a market/proposal — are gated by this check and **audited**
via `change_history` (`actor_id` + `action`); the dedicated `moderation_actions` table stays deferred to
Phase 4.

## Consequences
- **Positive:** a safe, reversible override exists from day one of community writes, with minimal surface.
- **Positive:** `user_roles` lands in its final shape, so Phase 4 extends it (adds roles/scopes/queue)
  rather than migrating it — see [rbac](../architecture/rbac.md).
- **Negative:** no admin UI polish in Phase 3 (actions are API-level, minimal) and only a single role is
  wired, so richer governance waits for Phase 4.
- **Neutral:** auditing break-glass through `change_history` instead of a purpose-built
  `moderation_actions` table is sufficient now but will be superseded when Phase 4 lands.
