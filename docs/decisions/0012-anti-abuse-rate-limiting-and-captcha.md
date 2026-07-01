# ADR-0012: Anti-abuse for anonymous contributions — Postgres rate limiting + CAPTCHA seam

**Status:** 🟢 Accepted
**Date:** 2026-07-01

## Context
Phase 3 opens **anonymous** writes: anyone can propose hours/locations and file reports without an
account (per [ADR-0007](0007-contribution-anonymous-propose-account-confirm.md)). That surface invites
spam, automated flooding, and vandalism (NFR-10/NFR-11). We need durable abuse controls that work on
**Azure Container Apps with scale-to-zero and >1 replica** — so any in-memory counter is unreliable
(each replica has its own memory, and instances come and go). We also want a bot-mitigation layer, but
on dev we don't yet have a CAPTCHA provider account or keys, and we don't want unconfigured infra to
block the community loop from shipping.

Forces: no shared cache (Redis) is provisioned; Postgres is already the source of truth; a third-party
CAPTCHA introduces an external dependency and per-environment keys; privacy rules forbid storing raw
client IPs.

## Decision
Two complementary controls on all anonymous writes:

1. **Durable, Postgres-backed per-IP rate limiting.** A fixed-window limiter records attempts in a
   small `contribution_attempts` table keyed by a **hashed** IP (SHA-256 salted with `AUTH_SECRET` —
   never the raw IP), pruning old rows opportunistically. Limits live in config
   (`RATE_LIMITS`); over-limit requests get `429`. Postgres (not in-memory) so it holds across replicas
   and cold starts.
2. **Provider-agnostic CAPTCHA seam,** gated by `CAPTCHA_ENABLED` (default **off** on dev). The verify
   step is an interface with a first **Cloudflare Turnstile** adapter; when enabled it **fails closed**
   if misconfigured, and when disabled it is inert. Client widget + server verification are wired now so
   enabling is a config/keys change, not a code change.

## Consequences
- **Positive:** abuse controls are durable and correct under scale-to-zero / multi-replica without new
  infra; the loop ships on dev today with rate limiting active and CAPTCHA ready to flip on.
- **Positive:** hashing the IP keeps only operational, short-retention data (see
  [security-privacy](../architecture/security-privacy.md)) — no raw IPs stored.
- **Negative:** a Postgres fixed-window limiter is coarser and chattier than Redis/sliding-window; fine
  at Phase 3 volumes, revisit if write volume grows.
- **Neutral:** CAPTCHA remains unproven until an operator provisions keys and flips the flag on dev.
