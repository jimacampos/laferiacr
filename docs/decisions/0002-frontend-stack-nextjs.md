# ADR-0002: Frontend stack — Next.js + React + TypeScript + Tailwind

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
v0 needed to be mobile-first, bilingual (ES/EN), fast on low-end phones, SEO-friendly (people will
search "feria del agricultor <town>"), and able to grow a backend/API later. The team wanted a single
codebase that serves both rendered pages and, eventually, API endpoints, without standing up a
separate backend service.

## Decision
Build the web app with **Next.js (App Router) + React + TypeScript + Tailwind CSS**. Use Next.js
**server-side rendering** for fast first paint and SEO, and Next.js **route handlers** for the API in
later phases. This is already the v0 implementation.

## Consequences
- **Positive:** one framework for UI + API; great SSR/SEO; strong ecosystem; TS safety; Tailwind speeds
  responsive, accessible UI.
- **Positive:** SSR pairs naturally with a container host ([ADR-0003](0003-compute-azure-container-apps.md)).
- **Neutral:** Next.js 16 defaults to Turbopack and ships some breaking changes — pinned and managed.
- **Negative:** SSR requires an always-available compute host (vs pure static); mitigated by
  scale-to-zero containers.
