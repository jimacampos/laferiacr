// Pure identity-resolution policy for sign-in (no prisma import — safe to unit test and to
// share with the auth callback). See docs/architecture/security-privacy.md and
// docs/decisions/0005-identity-entra-external-id.md.
//
// Background: Entra External ID (CIAM) can hand us a *different* `oid`/`sub` on each login for
// the same email one-time-passcode account. Our original upsert keyed purely on that subject,
// so every sign-in minted a fresh users row and stranded any role grants on rows we no longer
// landed on. To keep one human == one account we anchor on the verified email when we have it,
// falling back to the subject-keyed upsert only when there is no email (or no prior row).

/** Minimal shape of an existing users row we need when resolving identity. */
export interface ExistingUser {
  id: string;
}

/** How to map an incoming IdP subject to our internal users row. */
export type IdentityResolution =
  | { kind: "reuse"; userId: string }
  | { kind: "upsertByExternalId" };

/**
 * Decide how to resolve the internal users row for an incoming sign-in.
 * `existingByEmail` is the oldest row already known for the verified email (or null).
 */
export function resolveIdentity(input: {
  email: string | null;
  existingByEmail: ExistingUser | null;
}): IdentityResolution {
  if (input.email && input.existingByEmail) {
    return { kind: "reuse", userId: input.existingByEmail.id };
  }
  return { kind: "upsertByExternalId" };
}
