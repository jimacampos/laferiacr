# Implementation Plan: Trust & Accessibility Hardening

**Branch**: `002-trust-accessibility-hardening` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-trust-accessibility-hardening/spec.md`

> **Migration note**: Phase 6 is **planned, not built**. This plan captures known direction from the
> docs; run `/speckit.plan` + `/speckit.clarify` to resolve the reputation model and a11y gate before
> implementing.

## Summary

Harden trust and inclusivity: add **reputation-weighted confirmations** (configurable, degrading to
1-user = 1-vote), **anti-sybil heuristics + abuse monitoring/alerting + backups/DR**, a clearer
**conflict-resolution** path, and a formal **accessibility bar** (large-text / high-contrast modes,
WCAG 2.1 AA, validated with users across age groups).

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Prisma + PostgreSQL/PostGIS; Auth.js (NextAuth v5) roles; Application
Insights (observability/alerting); Tailwind CSS v4 (theming for accessible modes).

**Storage**: PostgreSQL — extends the existing `proposals`/`confirmations`/`user_roles`/
`moderation_actions` model with a reputation signal (field or table, TBD) and weight on confirmations.

**Testing**: Vitest for the weighted-promotion logic (pure functions preferred); automated a11y checks
(axe/Lighthouse) added to CI at an agreed threshold; manual keyboard + screen-reader passes.

**Target Platform**: Mobile-first responsive web (SSR).

**Project Type**: Web app (single Next.js project).

**Performance Goals**: No regression to read/confirm latency; weighting computed server-side in the
existing confirm path.

**Constraints**: WCAG 2.1 AA; server-side authorization only (never client claims); audited +
reversible governance actions; no auto-quarantine (OQ-009).

**Scale/Scope**: Community-scale; anti-sybil tuned to realistic small-launch traffic.

## Constitution Check

*GATE: aligns with La Feria CR Constitution v1.0.0.*

- **I. Code Quality** — reputation/weighting logic as typed, testable pure functions; no secrets;
  server-side role checks. PASS.
- **II. Testing Standards** — weighted-promotion and anti-sybil thresholds MUST have unit tests;
  a11y gate enters CI (Testing Standards explicitly anticipates this). PASS.
- **III. UX Consistency** — large-text/high-contrast modes, plain language, ~44px targets, reduced
  motion, screen-reader announcements: this feature *is* the accessibility bar. PASS.
- **IV. Performance** — weighting is O(votes) in the existing path; no heavy client additions. PASS.

No violations anticipated. If a reputation *table* + joins are introduced, note the trade-off here
during `/speckit.plan`.

## Project Structure

### Documentation (this feature)

```text
specs/002-trust-accessibility-hardening/
├── spec.md
├── plan.md              # This file
├── research.md          # (recommended) reputation model + a11y gate options — via /speckit.plan
├── data-model.md        # (recommended) reputation/weight schema — via /speckit.plan
└── tasks.md             # via /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (settings)/      # accessibility preferences (large-text / high-contrast)
│   └── admin/           # abuse alerts / conflict escalation surfacing
├── components/          # theme toggles; conflict display; a11y primitives
├── lib/
│   ├── promotion.ts     # weighted net-confirmation + promotion (extend existing loop)
│   ├── reputation.ts    # reputation → weight (new; pure, tested)
│   └── abuse.ts         # anti-sybil heuristics / anomaly signals (new)
└── i18n/                # plain-language ES/EN copy review
```

**Structure Decision**: Single Next.js web app. Backend change is concentrated in the confirmation/
promotion path plus new reputation/abuse helpers; frontend adds accessibility modes + conflict UX.

## Related decisions & docs

- `docs/product/roadmap.md` §Phase 6 · `docs/product/prd.md` FR-30, NFR-20, NFR-21
- `docs/accessibility.md` (targets, testing plan, open a11y-gate question, BL-010 Senior mode)
- `docs/architecture/moderation-trust.md` (OQ-002 reputation weighting, OQ-003 scoping, OQ-009)
- `docs/architecture/security-privacy.md` (abuse controls, audit, DR posture)
- [ADR-0008](../../../docs/decisions/0008-promotion-automated-confirmation-and-roles.md),
  [ADR-0014](../../../docs/decisions/0014-rbac-moderation-queue-and-temp-bans.md)

## Open questions to resolve in `/speckit.clarify`

- Reputation formula, tiers, and whether it is a `users.reputation` field or a derived/materialized value.
- The automated a11y gate (axe vs Lighthouse) and the CI score threshold to enforce.
- "Senior mode" (dedicated simplified UI) vs scalable settings only (BL-010).
- Anti-sybil thresholds and what constitutes an alert-worthy anomaly.
