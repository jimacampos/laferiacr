# ADR-0015: Admin-configurable settings via an `app_config` table (Phase 4)

**Status:** 🟢 Accepted
**Date:** 2026-07-01

## Context
The net-confirmation threshold **N** that auto-promotes a community edit
([ADR-0008](0008-promotion-automated-confirmation-and-roles.md)) was seeded to `2`
([OQ-001](../product/backlog.md)) and read from the `CONFIRMATION_THRESHOLD` environment
variable. Env-only tuning means changing N requires a redeploy and operator access — too heavy
for a value a Super Admin should be able to adjust as the community grows. Phase 4 explicitly
calls for making N **admin-configurable**, and more runtime-tunable policy values are likely to
follow.

Forces: the value must have a **safe default** so the app runs unconfigured on dev; existing
env-based configuration must keep working (back-compat); the resolver must stay **pure/testable**;
and any change must be **audited** like every other privileged action (see
[ADR-0014](0014-rbac-moderation-queue-and-temp-bans.md)).

## Decision
Introduce a small key/value **`app_config`** table (`key` PK, `value` text, `updated_at`,
`updated_by`). N is resolved by precedence **DB → env → built-in default (2)**:

- The precedence and parsing (`parseThreshold`, `resolveThreshold`) live in the pure, client-safe
  `config.ts` and are unit-tested; the DB read (`resolveConfirmationThreshold`) lives in
  `settings.ts`. The promotion engine (`voting.ts`) now resolves N DB-first at write time.
- A Super Admin edits N from the `/admin/settings` screen via `GET/POST /api/admin/config`
  (gated by the `configure_policy` capability). Values are validated (positive integer) and each
  change is written to **`moderation_actions`** with the previous and new value.
- The migration **seeds** `confirmation_threshold` so the DB is the source of truth once applied,
  while the env var remains a valid fallback for environments without the row.

## Consequences
- **Positive:** N is tunable at runtime by a Super Admin with no redeploy, and every change is
  audited.
- **Positive:** the `app_config` table is a reusable home for future runtime-tunable policy
  (e.g. rate limits, feature flags) without new tables per setting.
- **Positive:** back-compat is preserved — unset DB and env both fall through to the default `2`,
  so existing deployments and tests are unaffected.
- **Negative:** a key/value table is loosely typed; each new key needs its own validation on the
  write path (as N does) to stay safe.
- **Neutral:** the pure resolver plus the DB reader is a small amount of extra indirection,
  consistent with the existing `promotion.ts`/`voting.ts` pure-vs-DB split.
