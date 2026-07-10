# Implementation Plan: Photos (North Star) + Richer Community

**Branch**: `004-photos-community` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-photos-community/spec.md`

> **Migration note**: Phase 8 is **planned, not built** and is the product's north star. This plan
> covers **photos only**; the ordered backlog (reviews, prices, favorites, steward) becomes separate
> specs later. Run `/speckit.plan` + `/speckit.clarify` before implementing.

## Summary

Deliver **market/stall photos**: safe, signed-in uploads with EXIF/GPS stripping and Azure AI Content
Safety screening + human review, an accessible CDN-delivered gallery on the market detail page, and
full integration with the existing moderation/audit tooling.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Prisma + PostgreSQL; **Azure Blob Storage + CDN** (storage/delivery);
**Azure AI Content Safety** (screening); Auth.js (upload requires sign-in); existing moderation stack.

**Storage**: PostgreSQL for photo metadata + moderation linkage; **Blob Storage** for the image bytes;
CDN for delivery. New `photos` table; `reports`/`moderation_actions` gain a photo `target_type`.

**Testing**: Vitest for upload validation, EXIF-strip verification, and screening-state transitions
(pure/mocked); manual accessibility pass on the gallery; moderation-flow verification.

**Target Platform**: Mobile-first responsive web (SSR).

**Project Type**: Web app (single Next.js project).

**Performance Goals**: Photos CDN-delivered and appropriately sized; must not block core market info
(NFR-30); lazy/responsive images.

**Constraints**: Fail-safe screening (never auto-publish on error); EXIF/GPS stripped (privacy);
secrets (storage keys, content-safety keys) in Key Vault; audited + reversible moderation; alt text +
keyboard/screen-reader gallery (WCAG 2.1 AA).

**Scale/Scope**: Community-scale uploads; per-user/per-market limits TBD in planning.

## Constitution Check

*GATE: aligns with La Feria CR Constitution v1.0.0.*

- **I. Code Quality** — upload/screening/moderation as typed, testable modules; storage/CS keys via
  Key Vault, never in code. PASS.
- **II. Testing Standards** — validation, EXIF-strip, and screening-state logic MUST have unit tests;
  fail-safe path explicitly tested. PASS.
- **III. UX Consistency** — accessible gallery (alt text, keyboard), bilingual upload/consent/terms
  copy, inviting empty state, plain language. PASS.
- **IV. Performance** — CDN delivery, responsive/lazy images, core info never blocked. PASS.

No violations anticipated. Adding Blob Storage + a content-safety dependency is justified by the
feature; capture any pipeline complexity during `/speckit.plan`.

## Project Structure

### Documentation (this feature)

```text
specs/004-photos-community/
├── spec.md
├── plan.md              # This file
├── research.md          # (recommended) storage/CDN + content-safety pipeline — via /speckit.plan
├── data-model.md        # (recommended) photos schema + moderation linkage — via /speckit.plan
└── tasks.md             # via /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── market/[slug]/   # gallery on the detail page + upload entry
│   ├── admin/           # photo moderation in the existing queue
│   └── api/
│       └── photos/      # upload / screening callback / delete route handlers
├── components/          # accessible Gallery, PhotoUpload
├── lib/
│   ├── photos.ts        # upload validation, EXIF strip, state transitions (new; tested)
│   └── content-safety.ts# Azure AI Content Safety client (new)
└── i18n/                # ES/EN upload, consent, terms, empty-state copy
```

**Structure Decision**: Single Next.js web app. Adds a Blob Storage-backed upload pipeline with
content-safety screening, a new `photos` table, an accessible gallery on the detail page, and photo
support in the existing reports/moderation queue.

## Related decisions & docs

- `docs/product/roadmap.md` §Phase 8 · `docs/product/vision.md` (north star: photos) ·
  `docs/product/prd.md` FR-50, FR-51
- Backlog BL-002 (reviews), BL-003 (prices), BL-004 (favorites), BL-005 (Market Steward) — future specs
- `docs/architecture/overview.md` (Blob + CDN), `docs/architecture/data-model.md` (entities),
  `docs/architecture/moderation-trust.md` + `docs/architecture/security-privacy.md` (content safety,
  UGC license, EXIF stripping)

## Open questions to resolve in `/speckit.clarify`

- Image constraints (formats, max size), per-user/per-market upload limits, and thumbnail/variant
  strategy.
- Exact moderation states for photos (screening → pending → approved/removed) and pre- vs post-publish
  review.
- Final UGC license wording and takedown SLA.
- Whether favorites (BL-004) ship here or with Phase 7 notifications.
