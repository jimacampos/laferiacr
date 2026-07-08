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

### Locked decisions (implemented)
- **Promotion by community confirmation, not moderator approval.** A submission is a votable entity
  with its own `submission_confirmations` table (mirroring `confirmations`, so the proposal flow is
  untouched). It auto-promotes at **N net** confirmations (`confirm − reject`), reusing the shared
  threshold (DB → env → default 2). The submitter cannot confirm their own entry.
- **Soft duplicate detection — warn, never block.** Likely duplicates (Sørensen–Dice name similarity
  ≥ 0.6 **or** within 500 m) are surfaced live as the user types and again in the create response, but
  the user may always proceed. Strictness stays tunable with real data (backlog).
- **Sign-in required to submit.** Adding a whole market is higher-risk than a single field edit, so it
  requires an authenticated, non-banned account; the write is also rate-limited and CAPTCHA-gated.
  Confirmations remain account-gated.

## Consequences
- **Positive:** coverage grows beyond the static official list; keeps data current and locally accurate.
- **Positive:** provenance + verification let users judge trustworthiness; official records stay
  distinguishable.
- **Negative:** risk of duplicates/spam/fakes → duplicate detection, pending status, confirmations,
  and moderation mitigate it.
- **Neutral:** **duplicate-detection strictness** (how aggressively to merge/block near-matches) is an
  open question to tune with real data.
