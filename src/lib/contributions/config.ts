// Central policy/config for the contribution loop. Values that are meant to be
// operator-tunable are read from the environment (and, for N, the DB — see settings.ts) with
// conservative defaults so the app runs unconfigured on dev. This module stays free of
// prisma/server imports because client components import constants from it.

/** Default N when neither DB nor env supplies a valid value (OQ-001 → 2). */
export const DEFAULT_CONFIRMATION_THRESHOLD = 2;

/** Parse a threshold string to a valid positive int, or null if absent/invalid. Pure. */
export function parseThreshold(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Resolve N by precedence: DB config → env → built-in default. Pure so the precedence is
 * unit-testable; the DB read lives in settings.ts (`resolveConfirmationThreshold`).
 */
export function resolveThreshold(
  dbRaw: string | null | undefined,
  envRaw: string | null | undefined,
): number {
  return (
    parseThreshold(dbRaw) ??
    parseThreshold(envRaw) ??
    DEFAULT_CONFIRMATION_THRESHOLD
  );
}

/**
 * Net confirmations (confirm − reject) required to auto-promote, from **env only**. Kept as
 * the synchronous fallback/back-compat reader; the app resolves N DB-first via
 * `resolveConfirmationThreshold` (settings.ts) so a Super Admin can tune it at runtime.
 */
export function confirmationThreshold(): number {
  return (
    parseThreshold(process.env.CONFIRMATION_THRESHOLD) ??
    DEFAULT_CONFIRMATION_THRESHOLD
  );
}

/** Whether CAPTCHA verification is enforced on anonymous writes (off on dev until keys exist). */
export function captchaEnabled(): boolean {
  return process.env.CAPTCHA_ENABLED === "true";
}

/** Per-IP rate limits for anonymous writes (durable, Postgres-backed — see ADR-0012). */
export const RATE_LIMITS = {
  proposal: { max: 10, windowMs: 60 * 60 * 1000 },
  report: { max: 20, windowMs: 60 * 60 * 1000 },
} as const;

export type ContributionAction = keyof typeof RATE_LIMITS;

/** Contributable market fields in Phase 3. */
export const PROPOSAL_FIELDS = ["hours", "location"] as const;
export type ProposalField = (typeof PROPOSAL_FIELDS)[number];

/** Max length for a free-text hours proposal. */
export const HOURS_MAX_LENGTH = 120;

/**
 * Rough Costa Rica bounding box used to reject obviously-invalid location pins
 * (lat/lng outside the country). Not a precise boundary — a sanity guard.
 */
export const CR_BOUNDS = {
  minLat: 7.5,
  maxLat: 11.5,
  minLng: -86.5,
  maxLng: -82.0,
} as const;
