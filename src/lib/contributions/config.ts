// Central policy/config for the Phase 3 contribution loop. Values that are meant to be
// operator-tunable (per ADR-0008: N is Super-Admin configurable) are read from the
// environment with conservative defaults so the app runs unconfigured on dev.

/** Net confirmations (confirm − reject) required to auto-promote a proposal (OQ-001 → N=2). */
export function confirmationThreshold(): number {
  const raw = Number.parseInt(process.env.CONFIRMATION_THRESHOLD ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 2;
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
