import { prisma } from "@/lib/prisma";

import { resolveConfirmationThreshold } from "./settings";

// The moderation "markets requiring attention" queue (Phase 4 follow-up, BL-020): the
// confirmation backlog. It surfaces markets whose community-suggested changes are still
// `pending` — i.e. they haven't gathered enough net confirmations to reach the threshold N —
// so a moderator can find stale suggestions and help push them over the line. Abuse/reports
// live in the separate reports queue (moderation.ts); this view is purely about confirmations.

/** Proposed field of a market a suggestion targets. */
export type SuggestionField = "hours" | "location";

export interface PendingSuggestion {
  proposalId: string;
  field: string;
  /** Net confirmations so far: confirmCount - rejectCount. */
  net: number;
  /** How many more net confirmations are still needed to verify (never negative). */
  remaining: number;
  createdAt: string;
}

export interface AttentionMarket {
  marketId: string;
  slug: string;
  name: string;
  /** ISO timestamp of this market's oldest pending suggestion (drives the "most stale" order). */
  oldestPendingAt: string;
  suggestions: PendingSuggestion[];
}

/**
 * Pure: how many more net confirmations a suggestion still needs to reach the threshold.
 * Clamped at 0 so an (edge-case) over-threshold pending value never reports a negative need.
 */
export function remainingConfirmations(net: number, threshold: number): number {
  return Math.max(0, threshold - net);
}

/**
 * Pure: order the confirmation backlog "by need" — oldest/most-stale first. Markets are ranked
 * by their oldest pending suggestion (longest-waiting leads); each market's suggestions are
 * likewise ordered oldest-first. Non-mutating (returns new arrays), stable on ties.
 */
export function orderAttentionMarkets(
  markets: AttentionMarket[],
): AttentionMarket[] {
  return [...markets]
    .map((m) => ({
      ...m,
      suggestions: [...m.suggestions].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    }))
    .sort(
      (a, b) =>
        new Date(a.oldestPendingAt).getTime() -
        new Date(b.oldestPendingAt).getTime(),
    );
}

/**
 * The confirmation backlog: every market with at least one `pending` proposal, each suggestion
 * annotated with its net confirmations and how many more it needs (given the current threshold
 * N). Hidden/non-active markets are excluded — their suggestions can't be confirmed publicly.
 * Ordered oldest-first by {@link orderAttentionMarkets}.
 */
export async function getConfirmationBacklog(): Promise<AttentionMarket[]> {
  const threshold = await resolveConfirmationThreshold();

  const proposals = await prisma.proposal.findMany({
    where: { status: "pending", market: { status: "active" } },
    select: {
      id: true,
      field: true,
      confirmCount: true,
      rejectCount: true,
      createdAt: true,
      marketId: true,
      market: { select: { slug: true, name: true } },
    },
  });

  const byMarket = new Map<string, AttentionMarket>();
  for (const p of proposals) {
    const net = p.confirmCount - p.rejectCount;
    const createdAt = p.createdAt.toISOString();
    const suggestion: PendingSuggestion = {
      proposalId: p.id,
      field: p.field,
      net,
      remaining: remainingConfirmations(net, threshold),
      createdAt,
    };

    const existing = byMarket.get(p.marketId);
    if (existing) {
      existing.suggestions.push(suggestion);
      if (createdAt < existing.oldestPendingAt) {
        existing.oldestPendingAt = createdAt;
      }
    } else {
      byMarket.set(p.marketId, {
        marketId: p.marketId,
        slug: p.market.slug,
        name: p.market.name,
        oldestPendingAt: createdAt,
        suggestions: [suggestion],
      });
    }
  }

  return orderAttentionMarkets([...byMarket.values()]);
}
