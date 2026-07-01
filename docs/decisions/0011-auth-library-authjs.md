# ADR-0011: Auth library — Auth.js (NextAuth v5)

**Status:** 🟢 Accepted
**Date:** 2026-07-01

## Context
[ADR-0005](0005-identity-entra-external-id.md) chose **Microsoft Entra External ID** (CIAM) as the
identity *service* (Google + email OTP over OIDC) but did not pick the *client library* that runs
inside the Next.js app to drive sign-in, validate tokens, manage the session cookie, and map the IdP
subject to our internal `users` row. Phase 2 needs that integration.

Forces:
- We run **Next.js 16 App Router** (SSR + route handlers) on a single Container App — we want auth
  that fits server components/route handlers, not a separate service.
- Entra External ID is standard **OIDC**, so any compliant client works; the CIAM authority URL
  differs from workforce Entra ID (`https://<tenant>.ciamlogin.com/...`), so the library must allow a
  **custom issuer/authority**.
- We prefer a managed session cookie and minimal custom crypto/token handling.
- Low operational surface and good TypeScript support matter.

Alternatives considered:
- **MSAL (`@azure/msal-node` / `@azure/msal-browser`).** First-party Microsoft SDK, very capable, but
  lower-level for App Router: we'd hand-roll session cookies, route handlers, and the React glue.
- **Hand-rolled OIDC** (e.g. `openid-client`). Maximum control, most code to own and secure.
- **Auth.js (NextAuth v5).** App Router-native, provides the session cookie, callbacks, and a
  Microsoft Entra ID provider that accepts a custom `issuer`; smallest integration for our needs.

## Decision
Use **Auth.js (NextAuth v5, the `next-auth@beta` package)** with a **Microsoft Entra External ID**
OIDC provider (custom CIAM issuer). Auth.js owns the sign-in/out routes and the session; a `signIn`/
`jwt` callback **upserts the `users` row** by IdP subject (`externalId`). Sessions use the JWT
strategy (no DB session table needed for Phase 2). Secrets (`AUTH_SECRET`, Entra client id/secret)
come from env/Key Vault. The map from provider claims → internal user keeps the rest of the app
decoupled from the auth library.

## Consequences
- **Positive:** minimal, App Router-native integration; managed session cookie; easy to add more OIDC
  providers later; strong TS types; login stays optional for browsing (only needed to confirm, per
  [ADR-0007](0007-contribution-anonymous-propose-account-confirm.md)).
- **Positive:** thin seam (`externalId` → `users`) means the auth library is replaceable without
  touching domain code.
- **Negative:** NextAuth v5 is beta; some APIs may shift before GA. Pinned and isolated behind
  `src/auth.ts` to limit blast radius.
- **Neutral:** CIAM requires a correct `issuer`/`wellKnown` and matching redirect URIs; captured in
  the Entra setup runbook. Which extra social providers to enable remains an open question (ADR-0005).
