# ADR-0008: Promotion — automated confirmation + role governance

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
We need a way to turn community proposals into trusted "verified" data **at scale without requiring a
human to approve every edit**. Pure manual moderation doesn't scale and slows contributors; pure
automation can be gamed or vandalized. The operator wants everyday edits to flow automatically, with
humans available for safety and exceptions, plus multiple privileged roles (a community-safety
moderator and a super admin).

## Decision
Promote proposals **automatically** once they reach a **confirmation threshold N** (account-gated
votes for the same value). Layer **role-based governance** on top: **Community Safety** moderators
remove/hide abusive content and resolve reports; **Super Admin** can override fields, manage roles,
configure **N**, and revert. All privileged actions are **audited and reversible**. Reputation
weighting of votes is deferred to a later phase; v1 is one-user-one-vote.

## Consequences
- **Positive:** normal contributions need **no human gate** → fast, scalable, motivating.
- **Positive:** humans focus only on abuse/conflicts/policy; everything privileged is audited and
  reversible ([rbac](../architecture/rbac.md), [moderation-trust](../architecture/moderation-trust.md)).
- **Negative:** a low **N** risks bad auto-promotions; a high **N** stalls updates → N is configurable
  and starts conservative; **its value is an open question**.
- **Neutral:** deferring reputation weighting keeps v1 simple but means all early votes count equally.
