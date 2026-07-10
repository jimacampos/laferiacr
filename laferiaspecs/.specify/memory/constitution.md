<!--
SYNC IMPACT REPORT
Version change: (unratified template) → 1.0.0
Rationale: First ratification of a concrete constitution (MINOR/PATCH history N/A);
initial adoption is versioned 1.0.0.

Principles defined (4, as requested):
  - I. Code Quality
  - II. Testing Standards
  - III. User Experience Consistency
  - IV. Performance Requirements

Sections added:
  - Technology & Data Standards
  - Development Workflow & Quality Gates
  - Governance

Templates checked for consistency:
  ✅ .specify/templates/plan-template.md — generic "Constitution Check" gate; no hardcoded
     principles, remains valid.
  ✅ .specify/templates/spec-template.md — no principle-specific mandatory sections to change.
  ✅ .specify/templates/tasks-template.md — task categories already cover testing/quality;
     no edits required.
  ✅ .specify/templates/checklist-template.md — no changes required.

Deferred TODOs: none. All placeholders resolved; ratification date set to first adoption.
-->

# La Feria CR Constitution

La Feria CR is a mobile-first, bilingual web app that helps people in Costa Rica find when and
where the *ferias del agricultor* (farmer's markets) are open. It must stay trustworthy, genuinely
usable across ages and tech comfort levels, fast on modest phones, and cheap to run. These
principles are the non-negotiable engineering rules that keep it that way.

## Core Principles

### I. Code Quality

Code MUST be typed, linted, and small.

- TypeScript runs in strict mode; `any` and non-null assertions used to silence the compiler are
  prohibited. Prefer precise types and the typed data accessors in `src/data/` over ad-hoc shapes.
- `npm run lint` (ESLint / `eslint-config-next`) MUST pass with no errors and no new warnings.
  Warnings are not "someday" debt — they are fixed or explicitly justified in review.
- Modules stay focused and colocated with what they serve (components, `lib/` helpers, `i18n/`,
  `data/`). Pure logic (filtering, search, "this weekend", data normalization) lives in `lib/` or
  `data/` accessors — not inline in components — so it is testable in isolation.
- Naming is self-documenting; comments explain *why*, not *what*. No dead code, no commented-out
  blocks, no unused exports left behind.
- **Secrets are never committed.** Configuration comes from environment variables (`.env`, see
  `.env.example`); credentials, tokens, and connection strings never appear in source or fixtures.

**Rationale:** A small, strictly-typed, lint-clean codebase is the cheapest way to keep a
community-facing product correct and safe to change as contributors come and go.

### II. Testing Standards

Behavior that matters MUST be protected by automated tests.

- Unit tests use Vitest and live next to the code they cover as `*.test.ts` (the `@/*` alias works
  via `vite-tsconfig-paths`).
- Pure, rule-driven logic — day/region filtering, free-text search, "this weekend" resolution,
  data normalization (e.g. `"Viernes - sábado"` → `["fri","sat"]`), i18n selection — MUST have
  unit tests covering its meaningful cases, including edge cases and empty/malformed input.
- **Every bug fix ships with a regression test** that fails before the fix and passes after.
- CI runs lint, tests, and build; **all three MUST be green before merge.** A red pipeline blocks
  merge — no exceptions, no "fix it later."
- As the app grows, accessibility checks (e.g. axe / Lighthouse) SHOULD be added to CI per the
  accessibility plan; when added, their agreed threshold is a gate, not advisory.

**Rationale:** The data-shaping and filtering rules are the heart of the product's correctness;
untested, they silently rot. Regression tests turn each incident into permanent protection.

### III. User Experience Consistency

The interface MUST be consistent, inclusive, and usable by non-technical people.

- **Mobile-first & responsive:** designed for a phone in a hurry, in bright sun, one-handed; it
  scales up to desktop without a separate design language.
- **Bilingual, Spanish-first:** all user-facing text goes through the `i18n/` dictionaries in both
  ES and EN — no hard-coded strings. The language choice is easy to find and remembered.
- **Accessibility is a requirement (WCAG 2.1 AA):** semantic HTML first (ARIA only to fill gaps);
  full keyboard operability with visible focus; tap targets ≥ ~44×44 px; plain language; strong
  contrast with meaning never carried by color alone; `prefers-reduced-motion` respected.
- **Every map interaction has a non-map alternative** (typing/manual entry), because maps are hard
  for some users and assistive tech.
- **Reuse shared components** (Header, FilterBar, MarketCard, MarketList, …) and existing patterns
  rather than introducing one-off variants; consistency across screens is itself a feature.
- Flows stay low-friction: sensible defaults ("this weekend"), minimal required steps and typing,
  forgiving input with clear errors and confirmation before destructive actions.

**Rationale:** The product only succeeds if an older, non-technical shopper can find their market
in seconds. Inclusivity and consistency are core value, not polish.

### IV. Performance Requirements

The app MUST feel fast on modest phones and slow connections, and stay cheap to run.

- **Fast first paint:** prefer SSR / static rendering and build-time data bundling; content the
  user needs first is not gated behind large client-side fetches.
- **Small payloads:** minimize shipped JavaScript and asset weight; do not add client components,
  dependencies, or libraries where a server component or a few lines of code suffice. New heavy
  dependencies require justification in review.
- **Efficient data access:** database queries are indexed and avoid N+1 patterns; data that can be
  computed at build time is not recomputed per request. Data already bundled (the official list)
  is read from the typed module, not re-fetched.
- **Cost discipline:** the deployment target is serverless Azure that scales to zero — code and
  data-access choices MUST respect pay-for-what-you-use economics while the project is early.

**Rationale:** Speed and low cost are product requirements here: users are on modest devices and
outdoor connections, and the project must survive on a small, usage-based budget.

## Technology & Data Standards

- **Stack (authoritative):** Next.js 16 (App Router) + React 19, TypeScript, Tailwind CSS v4,
  Prisma + PostgreSQL, NextAuth, Vitest, ESLint. This is NOT the Next.js of older training data —
  consult `node_modules/next/dist/docs/` and heed deprecation notices before using framework APIs.
- **The official list is the baseline that is never lost.** Community edits overlay official data;
  they never overwrite or destroy the seed baseline.
- **Regenerate, don't hand-edit generated data.** `src/data/ferias.json` is produced from the
  official spreadsheet via the documented generator (`scripts/generate_data.py`); update the source
  and regenerate rather than editing generated output by hand.
- **Configuration via environment** only (`.env` / `.env.example`); Prisma migrations are the way
  schema changes are applied (`db:migrate` / `db:migrate:dev`).
- **Scope discipline:** stay a farmer's-market guide. E-commerce, payments, vendor inventory, and
  general-events features are out of scope unless the constitution and roadmap are amended.

## Development Workflow & Quality Gates

- Every change lands via a pull request whose CI (lint + test + build) is green before merge.
- **Documentation moves with behavior.** When a change alters behavior, data shape, or a user-facing
  flow, the relevant docs (`README.md`, `docs/`) are updated in the same change.
- **UI changes carry an accessibility and i18n check:** semantics/keyboard/contrast considered, and
  both ES and EN strings provided, before merge.
- Reviewers verify compliance with these principles. A reviewer MUST block a PR that violates a
  principle unless the violation is explicitly justified and recorded (see Governance).
- Prefer ecosystem tooling (Prisma, ESLint, the framework's own generators) over manual edits that
  reintroduce risk.

## Governance

This constitution supersedes other engineering practices where they conflict. It governs how La
Feria CR is built; the product/vision docs govern what is built.

- **Compliance:** All PRs and reviews verify adherence to the Core Principles. Any deviation MUST be
  justified in the PR description (what, why, and the migration/cleanup path); unjustified deviations
  are not merged.
- **Amendments:** Proposed as a PR that edits this file, states the rationale and impact, and updates
  any dependent templates and docs in the same change. Approval by a project maintainer is required.
- **Versioning policy (semantic):**
  - **MAJOR** — backward-incompatible governance changes, or removing/redefining a principle.
  - **MINOR** — adding a new principle or section, or materially expanding guidance.
  - **PATCH** — clarifications, wording, and non-semantic refinements.
- **Review cadence:** the constitution is revisited at each roadmap phase boundary and whenever a
  recurring class of defect suggests a principle is missing or unclear.

**Version**: 1.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
