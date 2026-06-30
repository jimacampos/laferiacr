# ADR-0007: Contributions — anonymous propose, account required to confirm

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
The product vision is an inclusive **community page** where anyone can help keep market hours and
locations accurate — including older and non-technical users for whom a forced sign-up is a major
barrier. At the same time, data trust requires resistance to vote-stuffing and abuse. We must balance
**low friction to contribute** against **integrity of "verified" data**.

## Decision
Allow **anonymous proposals**: anyone can suggest an edit (hours/location) or submit a new market
without an account. Require **an account to confirm/reject** a proposal. Promotion to "verified"
happens only through account-gated confirmations
([ADR-0008](0008-promotion-automated-confirmation-and-roles.md)). Anonymous writes are rate-limited and
CAPTCHA-gated.

## Consequences
- **Positive:** maximum inclusivity for contributing; the hardest step (proposing) has the least
  friction, fitting non-technical users.
- **Positive:** trust signal (verification) is protected because it needs identifiable accounts and
  one-vote-per-user.
- **Negative:** anonymous endpoints invite spam → mitigated with rate limits, CAPTCHA, moderation
  ([moderation-trust](../architecture/moderation-trust.md)).
- **Neutral:** anonymous proposals lack a reputation trail; that's acceptable since they can't
  self-verify.
