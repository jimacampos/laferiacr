# ADR-0003: Compute — Azure Container Apps (scale-to-zero)

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
The app is a server-rendered Next.js app needing a real Node runtime (SSR + API route handlers). The
operator wants to **minimize cost** and operational overhead, with traffic that is low and bursty
(weekend-heavy). Options considered: Azure Static Web Apps (no full SSR/runtime control), App Service
(always-on, higher floor cost), AKS (too much ops), Azure Functions (awkward for full Next.js SSR),
and Container Apps.

## Decision
Host the containerized Next.js app on **Azure Container Apps (Consumption)** with **scale-to-zero**.
Images are stored in **Azure Container Registry**; deploys come from GitHub Actions.

## Consequences
- **Positive:** runs the real Next.js server; **scales to zero** when idle → minimal cost; scales out
  on demand; managed platform (no cluster ops).
- **Positive:** clean fit with Bicep IaC and GitHub Actions CD ([infrastructure](../architecture/infrastructure.md)).
- **Negative:** **cold starts** after idle; prod may pin min-1 replica (small cost) to avoid latency —
  an open question in infrastructure.md.
- **Neutral:** requires maintaining a Dockerfile and image pipeline.
