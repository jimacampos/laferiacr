// Pure, dependency-free promotion rule for the contribution loop. Extracted from the
// transactional `castVote` so the auto-promotion decision (net confirmations vs threshold N)
// is unit-testable without a database. Keep this module free of prisma/server imports.

/** A proposal's current vote tally. */
export interface VoteTally {
  confirmCount: number;
  rejectCount: number;
}

/** Net confirmations for a proposal: confirmations minus rejections. */
export function netConfirmations(tally: VoteTally): number {
  return tally.confirmCount - tally.rejectCount;
}

/**
 * Auto-promotion decision: a pending proposal is promoted once its **net** confirmations
 * (confirm − reject) reach the threshold **N**. The proposer's own vote is excluded upstream
 * (see `castVote`), so this only ever sees votes from other accounts.
 */
export function shouldPromote(tally: VoteTally, threshold: number): boolean {
  return netConfirmations(tally) >= threshold;
}

/** Confirmations still needed to reach the threshold (never negative). */
export function remainingConfirmations(
  tally: VoteTally,
  threshold: number,
): number {
  return Math.max(0, threshold - netConfirmations(tally));
}
