# ADR-0016: Email-anchored identity resolution

**Status:** 🟢 Accepted (amends [ADR-0005](0005-identity-entra-external-id.md))
**Date:** 2026-07-01

## Context
[ADR-0005](0005-identity-entra-external-id.md) chose Entra External ID and stated that the internal
`users.external_id` maps to the token's **`oid`** claim, "immutable per Microsoft's guidance," with the
row upserted by that subject in the Auth.js `jwt` callback.

In dev testing this assumption broke: the External ID tenant returned a **different `oid` on each
login** for the *same* email one-time-passcode account. Because the upsert keyed purely on the subject,
every sign-in hit the `create` branch and minted a **fresh, role-less `users` row**. A single tester
accumulated five rows for one email, and any `super_admin` grant was stranded on an older row the tester
no longer landed on — so Moderation tools appeared and disappeared across logout/login cycles.

Whatever the tenant-side cause, the app must not fan one human out into many accounts (it strands role
grants, splits contribution history, and inflates user counts). We need identity resolution that is
robust to an unstable subject.

## Decision
Anchor internal identity on the **verified email** when present. On sign-in the `jwt` callback:

1. If the token carries an email, look up the **oldest existing `users` row** for that email and
   **reuse** it (refreshing `email`/`displayName`), so one email == one account.
2. Otherwise (no email, or no prior row) fall back to the original **`external_id`-keyed upsert**.

The decision logic lives in a pure, unit-tested module (`src/lib/authIdentity.ts` →
`resolveIdentity()`); the `jwt` callback in `src/auth.ts` performs the thin Prisma reads/writes. On the
reuse path we deliberately **do not rewrite `external_id`**, avoiding a unique-constraint clash with any
other rows already stranded for that email.

## Consequences
- **Positive:** one human == one `users` row; role grants (e.g. `super_admin`) persist across logins
  regardless of subject churn; user counts and contribution history stop fragmenting.
- **Positive:** the fix is app-side only — no External ID tenant reconfiguration required.
- **Negative:** email becomes an identity anchor. Two distinct IdP identities that present the **same
  verified email** would merge into one account. Acceptable for the current email-OTP-only dev setup;
  **revisit before enabling additional providers** (e.g. Google) where email collisions are likelier.
- **Neutral:** existing duplicate rows from before this change remain but are harmless — logins
  consolidate onto the oldest row; a one-off cleanup can remove the strays.
- **Follow-up:** if the tenant can be configured to emit a stable `oid`, subject-keying could return as
  the primary key; email-anchoring stays valid either way.
