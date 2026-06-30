# ADR-0001: Record architecture decisions

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
La Feria CR is moving from a shipped static v0 to a community-driven platform on Azure. Several
significant, hard-to-reverse decisions (compute, database, identity, contribution model) are being
made up front. We need a durable, lightweight record of *why* each choice was made so future
contributors don't re-litigate settled questions or lose the rationale.

## Decision
We will use **Architecture Decision Records** (ADRs) — one Markdown file per significant decision,
numbered sequentially under `docs/decisions/`, following the lightweight
**context / decision / consequences** format. ADRs are immutable once Accepted; a decision is changed
by adding a new ADR that supersedes the prior one. An index (`README.md`) lists all ADRs and their status.

## Consequences
- **Positive:** shared, versioned memory of decisions; faster onboarding; less churn on settled topics.
- **Positive:** decisions are reviewable via pull request like code.
- **Neutral:** small ongoing discipline to write an ADR when a significant decision is made.
- **Negative:** trivial decisions should *not* become ADRs — we accept some judgment about what counts.
