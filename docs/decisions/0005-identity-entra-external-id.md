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
