// Pure, dependency-free temp-ban policy for Phase 4 (see docs/architecture/moderation-trust.md,
// ADR-0014). Duration presets and the active/expiry math live here so they are unit-testable and
// safe to import from client components. The DB-backed helpers live in bans.ts.

/** Selectable ban durations. `permanent` has no expiry. */
export const BAN_DURATIONS = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  permanent: null,
} as const;

export type BanDuration = keyof typeof BAN_DURATIONS;

/** True when `value` is a supported ban-duration preset. */
export function isBanDuration(value: unknown): value is BanDuration {
  return typeof value === "string" && value in BAN_DURATIONS;
}

/** Expiry timestamp for a duration preset (null = permanent). Pure. */
export function banExpiry(duration: BanDuration, from: Date = new Date()): Date | null {
  const ms = BAN_DURATIONS[duration];
  return ms === null ? null : new Date(from.getTime() + ms);
}

/** The subset of ban fields needed to decide whether it is currently in force. */
export interface BanWindow {
  expiresAt: Date | null;
  liftedAt: Date | null;
}

/**
 * Pure: is a ban currently in force? Active = not lifted early AND not expired; a null
 * `expiresAt` is a permanent ban.
 */
export function isBanActive(ban: BanWindow, now: Date = new Date()): boolean {
  if (ban.liftedAt !== null) return false;
  if (ban.expiresAt === null) return true;
  return ban.expiresAt.getTime() > now.getTime();
}
