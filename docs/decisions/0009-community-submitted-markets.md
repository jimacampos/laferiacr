# ADR-0009: Community-submitted new markets

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
The official June 2026 spreadsheet seeds 66 markets, but it is a **point-in-time snapshot** and will
miss new, small, or informal ferias. The community is best positioned to know about these. We want to
grow coverage beyond the official list while protecting against duplicates, spam, and low-quality or
fake entries.

## Decision
Allow the community to **submit new markets** (Phase 5). Submissions run **duplicate detection**
(name similarity + geographic proximity), enter as **pending/unverified**, and are promoted through
the same confirmation loop ([ADR-0008](0008-promotion-automated-confirmation-and-roles.md)) and subject
to moderation. Every market carries **provenance**: `Official (2026 list)` vs `Community-added`
([data-model](../architecture/data-model.md)).

## Consequences
- **Positive:** coverage grows beyond the static official list; keeps data current and locally accurate.
- **Positive:** provenance + verification let users judge trustworthiness; official records stay
  distinguishable.
- **Negative:** risk of duplicates/spam/fakes → duplicate detection, pending status, confirmations,
  and moderation mitigate it.
- **Neutral:** **duplicate-detection strictness** (how aggressively to merge/block near-matches) is an
  open question to tune with real data.
