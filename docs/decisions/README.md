# Architecture Decision Records (ADRs)

**Status:** 🟢 Index · _Last updated: 2026-07-01_

ADRs capture significant, hard-to-reverse decisions: the **context**, the **decision**, and its
**consequences**. They are immutable once accepted — to change a decision, add a new ADR that
supersedes the old one.

## Status legend
🟡 Proposed · 🟢 Accepted · 🔵 Superseded · ⚪ Deprecated

## Index
| # | Title | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | 🟢 Accepted |
| [0002](0002-frontend-stack-nextjs.md) | Frontend stack: Next.js + React + TS + Tailwind | 🟢 Accepted |
| [0003](0003-compute-azure-container-apps.md) | Compute: Azure Container Apps (scale-to-zero) | 🟢 Accepted |
| [0004](0004-database-postgresql-flexible.md) | Database: PostgreSQL Flexible Server + PostGIS | 🟢 Accepted |
| [0005](0005-identity-entra-external-id.md) | Identity: Microsoft Entra External ID | 🟢 Accepted |
| [0006](0006-maps-azure-maps.md) | Maps: Azure Maps | 🟢 Accepted |
| [0007](0007-contribution-anonymous-propose-account-confirm.md) | Contributions: anonymous propose, account to confirm | 🟢 Accepted |
| [0008](0008-promotion-automated-confirmation-and-roles.md) | Promotion: automated confirmation + role governance | 🟢 Accepted |
| [0009](0009-community-submitted-markets.md) | Community-submitted new markets | 🟢 Accepted |
| [0010](0010-orm-prisma.md) | ORM: Prisma (with the pg driver adapter) | 🟢 Accepted |
| [0011](0011-auth-library-authjs.md) | Auth library: Auth.js (NextAuth v5) | 🟢 Accepted |
| [0012](0012-anti-abuse-rate-limiting-and-captcha.md) | Anti-abuse: Postgres rate limiting + CAPTCHA seam | 🟢 Accepted |
| [0013](0013-minimal-roles-phase-3-break-glass.md) | Minimal `user_roles` in Phase 3 for break-glass | 🟢 Accepted |
| [0014](0014-rbac-moderation-queue-and-temp-bans.md) | Full RBAC, moderation queue, `moderation_actions`, temp-bans | 🟢 Accepted |
| [0015](0015-admin-configurable-settings-app-config.md) | Admin-configurable settings via `app_config` | 🟢 Accepted |
| [0016](0016-email-anchored-identity-resolution.md) | Email-anchored identity resolution (amends 0005) | 🟢 Accepted |

## Template
```markdown
# ADR-NNNN: <title>

**Status:** 🟡 Proposed | 🟢 Accepted | 🔵 Superseded by ADR-XXXX
**Date:** YYYY-MM-DD

## Context
What problem/forces are at play? Constraints, requirements, alternatives considered.

## Decision
The choice we are making, stated plainly.

## Consequences
Positive, negative, and neutral results; follow-ups and trade-offs accepted.
```
