# ADR-0005: Identity — Microsoft Entra External ID

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
Confirming proposals and moderating content require **accounts** (anonymous users can propose but not
confirm — see [ADR-0007](0007-contribution-anonymous-propose-account-confirm.md)). We want low-friction
sign-in for non-technical and older users, social login (Google) plus a no-app option (email OTP), and
we want to **avoid building/operating our own auth** (password storage, resets, breaches). We are
already committed to Azure, so a native identity service reduces integration and billing surface.

## Decision
Use **Microsoft Entra External ID** (customer identity) for authentication, enabling **Google** and
**email one-time-passcode** sign-in via standard OIDC. The app validates tokens server-side and maps
the IdP subject to an internal `users` record.

## Consequences
- **Positive:** managed, secure auth; social + passwordless options; generous free MAU tier supports
  the cost goal; native Azure fit.
- **Positive:** offloads credential security/compliance to the platform.
- **Negative:** ties identity to Azure/Entra; another service to configure (tenant, app registrations,
  redirect URIs).
- **Neutral:** which social providers beyond Google to enable is an **open question**.

## Implementation notes (Phase 2)
- **Client library:** Auth.js (NextAuth v5) with the `microsoft-entra-id` provider —
  see [ADR-0011](0011-auth-library-authjs.md). Sessions are stateless **JWTs**.
- **Internal key:** the `users.external_id` maps to the token's **`oid`** claim, the row is upserted in
  the Auth.js `jwt` callback. **Amended in Phase 4 ([ADR-0016](0016-email-anchored-identity-resolution.md)):**
  the External ID tenant was observed returning a *different* `oid` per login for the same email-OTP
  account, so identity now anchors on the **verified email** (reuse the existing row) and falls back to
  the `oid`-keyed upsert only when no email is present.
- **Optional in Phase 2:** sign-in is wired into the header but not required to read; route protection
  arrives in Phase 3. Operator setup: [`deploy/entra-external-id-setup.md`](../../deploy/entra-external-id-setup.md).
