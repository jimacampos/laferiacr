# Implementation Plan: Home & Discovery Redesign (Name-First)

**Branch**: `001-home-discovery-redesign` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-home-discovery-redesign/spec.md`

> **Migration note**: This plan is seeded from existing project docs. Most of the feature is already
> implemented on `dev`; refine with `/speckit.plan` before doing further work (notably FR-008 "near me").

## Summary

Reframe the home page around a **name-first search** with a redesigned, name-led card, an optional
(collapsed) day filter, a paginated A–Z directory, and no misleading time-based default — all without
depending on location data. The one remaining decision is an opt-in, consent-gated **"near me"**
distance view (FR-008), now viable since ~75% of active markets have coordinates.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Next.js route handlers/server components, Tailwind CSS v4; pure helpers in
`src/lib/` (`filters.ts`, `search.ts`, `home.ts`)

**Storage**: PostgreSQL Flexible Server + PostGIS via Prisma (markets read path); no new tables for
this feature. "Near me" reads existing `location` geography.

**Testing**: Vitest unit tests colocated as `*.test.ts` (e.g. `home.ts`/`search.ts` pure logic:
`paginate`, `pageCount`, `sortFeriasByName`, `letterFirstPage`, `highlightSegments`).

**Target Platform**: Mobile-first responsive web (SSR), scaling to desktop.

**Project Type**: Web app (single Next.js project, `src/` at repo root).

**Performance Goals**: Fast first paint on 4G (NFR-30, market list usable ~2s); ≤10 markets rendered
per page to keep payload small.

**Constraints**: WCAG 2.1 AA (`docs/accessibility.md`); accent-insensitive matching; `<mark>`
highlighting must keep contrast; `/` shortcut suppressed while typing; no personal-location storage
for "near me" (NFR-32).

**Scale/Scope**: ~73 active markets today; A–Z pagination designed to scale as community markets grow.

## Constitution Check

*GATE: aligns with La Feria CR Constitution v1.0.0.*

- **I. Code Quality** — pure, typed helpers in `src/lib/`; no region/phone dead UI (logic retained but
  unused is acceptable and documented). PASS.
- **II. Testing Standards** — pagination/sorting/highlighting logic covered by colocated Vitest tests;
  add tests for any "near me" distance sort. PASS (extend for FR-008).
- **III. UX Consistency** — mobile-first, bilingual ES/EN hero, semantic `<nav>`/`<mark>`, keyboard
  `/` shortcut, disclosure day filter, ~44px targets. Core of this feature. PASS.
- **IV. Performance** — 10/page pagination, SSR, small payloads, no heavy client deps. PASS.

No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-home-discovery-redesign/
├── spec.md              # This feature's spec (migrated)
├── plan.md              # This file
└── tasks.md             # Generate via /speckit.tasks (not created here)
```

### Source Code (repository root)

```text
src/
├── app/                 # Home route (App Router) — hero + directory
├── components/          # Header, Hero, BrandMark, MarketCard, FilterBar,
│                        #   Pagination, AlphaIndex, search input
├── lib/
│   ├── filters.ts       # day/region filtering + accent-insensitive search (region unused by home)
│   ├── search.ts        # highlightSegments + match helpers (+ *.test.ts)
│   └── home.ts          # paginate / pageCount / sortFeriasByName / letterFirstPage (+ *.test.ts)
├── data/                # ferias accessors / types
└── i18n/                # ES/EN dictionaries for hero + controls
```

**Structure Decision**: Single Next.js web app; this feature is UI + pure client/server helpers only,
no schema changes. "Near me" adds a consent-gated client geolocation read + a distance sort over the
existing `location` field.

## Related decisions & docs

- `docs/product/roadmap.md` §Phase 4.5 · `docs/product/prd.md` FR-60…FR-67
- Backlog BL-023, BL-024, BL-025, BL-026, BL-027, BL-028, BL-029
- Decisions OQ-013 (region removed), OQ-014 (geocoding likely unnecessary — community-only)
- `docs/accessibility.md` (directory navigation & search shortcut requirements)
