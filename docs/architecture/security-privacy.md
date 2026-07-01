# Security & Privacy — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-07-01_

Security and privacy posture for a public, community-edited app handling minimal personal data plus
**geolocation** and (later) **user photos**. Related: [rbac](rbac.md),
[moderation-trust](moderation-trust.md), [infrastructure](infrastructure.md).

## Authentication & authorization
- **AuthN:** Microsoft Entra External ID (Google + email OTP); standard OIDC; tokens validated per
  request ([ADR-0005](../decisions/0005-identity-entra-external-id.md)). Implemented with **Auth.js
  (NextAuth v5)** ([ADR-0011](../decisions/0011-auth-library-authjs.md)); sessions are stateless
  **JWTs** (no server session store), and the app persists only a minimal `users` row keyed on the
  immutable `oid` claim. Reading needs no account; Phase 3 protects confirm/reject routes.
- **AuthZ:** server-side RBAC on every mutating route, from DB-backed roles — never client claims
  ([rbac](rbac.md)). Phase 4 resolves capabilities via `can(userId, capability)` and route guards.
- **Anonymous writes** (Phase 3 proposals and reports; later new-market submissions) are allowed but
  rate-limited and CAPTCHA-gated; **confirmations require an account**.
- In Phase 3, proposal confirm/reject routes re-check the Auth.js session server-side; client claims
  are never trusted.
- **Temp-bans (Phase 4):** an active ban **blocks all content writes** (propose, confirm/reject,
  report) — enforced server-side in the write guards; governance routes are not ban-gated so a
  moderator can't self-lock ([ADR-0014](../decisions/0014-rbac-moderation-queue-and-temp-bans.md)).

## Data classification
| Data | Class | Handling |
| --- | --- | --- |
| Market info (hours, location, days) | Public | Freely shown; community-editable |
| Account email | Personal | Stored minimally; not shown publicly |
| Display name | Public-ish | User-chosen; Phase 3 contributions are pseudonymous (names not shown) |
| IP / device signals | Operational | Abuse prevention; hashed; short retention |
| Precise geolocation (user) | Sensitive | **Consent-based**, used at moment of action |
| Photos (Phase 8) | UGC | Moderated; license terms apply |

**Data minimization:** collect only what's needed to run the contribution loop. No background
location tracking. Contributor display names are not shown publicly in Phase 3 (OQ-008 default).

## Geolocation consent
- The browser geolocation prompt is **explicit and purpose-bound** ("use my current location to place
  this market's pin"). Users can always **drop a pin manually** instead.
- The UI copy is purpose-bound: "We'll use your location only to place this pin. We don't store your
  personal location."
- We submit/store only the chosen **market** coordinate (public), not a history of the user's personal
  location.

## Anonymous write abuse controls
- Anonymous proposals and reports use a durable Postgres-backed fixed-window rate-limit store
  (`contribution_attempts`), with old rows pruned opportunistically.
- Client IPs are SHA-256 hashed with `AUTH_SECRET`; raw IPs are never stored. Retention remains short
  and operational (OQ-012).
- CAPTCHA is provider-agnostic and gated by `CAPTCHA_ENABLED` (default off in dev). Cloudflare
  Turnstile is the first adapter; when enabled and misconfigured, verification fails closed
  ([ADR-0012](../decisions/0012-anti-abuse-rate-limiting-and-captcha.md)).

## User-generated content (ownership & licensing)
- Contributors grant La Feria CR a license to **display and distribute** their contributions (edits,
  submissions, later photos) within the app.
- Factual market data (hours/locations) is treated as openly shareable community data.
- Clear **Terms** and **content rules** at point of contribution
  ([content-guidelines](../community/content-guidelines.md)); users must not upload content they
  don't have rights to.
- Takedown path for IP or privacy complaints.

## Content safety
- **Text** (proposed values, names): validation, length limits, profanity/abuse checks, moderation queue.
- **Photos** (Phase 8): **Azure AI Content Safety** auto-screening + human Community Safety review
  before/after publish; EXIF/GPS stripped on upload.

## Secrets management
- All secrets (DB connection, Maps key, IdP client secret, `AUTH_SECRET`) in **Key Vault**; apps read
  via **managed identity** — none in code, config, or the repo.
- The map uses **no client secret at all**: the app identity is granted Azure Maps Data Reader and a
  server route mints a short-lived Entra token per request (see [infrastructure](infrastructure.md)).
- CI/CD uses **OIDC federated credentials** (no long-lived cloud secrets in GitHub)
  ([infrastructure](infrastructure.md)).

## Application security
- Input validation + parameterized queries (ORM) → no SQL injection.
- Output encoding / React escaping → XSS resistance; strict CSP where feasible.
- CSRF protection on cookie-based flows; bearer tokens for API.
- **Rate limiting** and flag-gated **CAPTCHA** on anonymous writes; **WAF** (Front Door) as traffic grows.
- HTTPS everywhere; HSTS; secure/SameSite cookies.
- Least-privilege identities between app, DB, and storage.

## Privacy & compliance posture
- Minimal PII; **deletion/export** path for account data on request.
- Transparent privacy notice covering data use, geolocation, and UGC licensing.
- Audit logs for privileged actions ([data-model](data-model.md) `change_history` in Phase 3;
  `moderation_actions` **dual-write** in Phase 4 records who/what/why for every governance action).
- Costa Rica data-protection (and GDPR-aligned good practice) considered before public launch.

## Abuse handling
- Tooling and policies in [moderation-trust](moderation-trust.md): reports queue, content removal,
  hide/unhide markets, temp-bans, revert, and Super-Admin override — all audited in
  `moderation_actions`.

## Open questions
- Retention windows for IP/device abuse signals.
- Exact UGC license wording (review before community launch).
- Logging/region requirements for CR data-protection compliance.
