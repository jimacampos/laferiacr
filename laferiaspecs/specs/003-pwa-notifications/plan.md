# Implementation Plan: PWA + Notifications

**Branch**: `003-pwa-notifications` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-pwa-notifications/spec.md`

> **Migration note**: Phase 7 is **planned, not built**. This plan captures known direction from the
> docs; run `/speckit.plan` + `/speckit.clarify` to settle the service-worker strategy and push
> provider before implementing.

## Summary

Make La Feria CR an **installable PWA** with an **offline market list**, then layer **opt-in push
notifications** (weekend-open-near-me, hours-changed) that respect language and consent and are fully
revocable — all within the serverless cost posture.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Next.js PWA support (web app manifest + service worker); web-push; **Azure
Notification Hubs** (candidate) for push fan-out; Prisma + PostgreSQL for subscriptions.

**Storage**: PostgreSQL — new push-subscription + notification-event/preference tables; client-side
service-worker cache for the offline market list.

**Testing**: Vitest for subscription/fan-out matching logic (pure functions); manual PWA install +
offline verification across browsers; permission grant/deny/revoke flows.

**Target Platform**: Mobile-first responsive web + installable PWA; graceful degradation on iOS/Safari
where push/install support is limited.

**Project Type**: Web app (single Next.js project).

**Performance Goals**: Fast first paint (NFR-30); offline list renders from cache; notification infra
idles cheaply (NFR-31).

**Constraints**: Explicit geolocation consent for "near me" pushes (NFR-32); ES/EN copy (NFR-33);
no stored personal-location history; no notifications without opt-in.

**Scale/Scope**: Small soft-launch volume; designed to grow with the community.

## Constitution Check

*GATE: aligns with La Feria CR Constitution v1.0.0.*

- **I. Code Quality** — subscription + fan-out as typed, testable modules; secrets (push keys) in Key
  Vault, never in code. PASS.
- **II. Testing Standards** — event→subscription matching and language selection covered by unit
  tests; offline behavior verified manually. PASS.
- **III. UX Consistency** — bilingual, purpose-bound consent copy, graceful degradation, clear offline
  messaging, plain language. PASS.
- **IV. Performance** — precache the minimum offline surface; small payloads; scale-to-zero-friendly
  push infra. PASS.

No violations anticipated. Adding a service worker + new tables is justified by the offline/push
requirements; note any caching complexity during `/speckit.plan`.

## Project Structure

### Documentation (this feature)

```text
specs/003-pwa-notifications/
├── spec.md
├── plan.md              # This file
├── research.md          # (recommended) SW strategy + push provider — via /speckit.plan
├── data-model.md        # (recommended) push subscription/event schema — via /speckit.plan
└── tasks.md             # via /speckit.tasks
```

### Source Code (repository root)

```text
public/
├── manifest.webmanifest # PWA manifest (name, icons, theme)
└── sw.js                # service worker (or generated)
src/
├── app/
│   ├── (settings)/      # notifications opt-in/out UI
│   └── api/
│       ├── push/        # subscribe/unsubscribe route handlers
│       └── notify/      # event → fan-out trigger (server)
├── lib/
│   ├── push.ts          # subscription + fan-out matching (new; pure, tested)
│   └── offline.ts       # cache/freshness helpers
└── i18n/                # ES/EN notification copy
```

**Structure Decision**: Single Next.js web app. Adds a manifest + service worker for the PWA, new
API routes and Prisma tables for subscriptions, and a server-side fan-out that reuses the existing
"hours changed" promotion signal and the coordinate data for "near me".

## Related decisions & docs

- `docs/product/roadmap.md` §Phase 7 · `docs/product/prd.md` FR-40, FR-41, NFR-30/31/32/33
- Backlog BL-008 (PWA install + offline list), BL-009 (opt-in push / Azure Notification Hubs)
- `docs/architecture/overview.md` (system context), `docs/architecture/infrastructure.md` (cost/infra),
  `docs/architecture/security-privacy.md` (consent, secrets, minimization)

## Open questions to resolve in `/speckit.clarify`

- Service-worker strategy: what is precached vs runtime-cached; cache-versioning/update UX.
- Push provider: Azure Notification Hubs vs direct Web Push; VAPID key management in Key Vault.
- Whether "hours changed" pushes require a **follow/favorite** concept (shared with Phase 8 BL-004).
- iOS/Safari support boundaries and the exact graceful-degradation behavior.
