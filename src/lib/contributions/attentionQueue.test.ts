import { describe, expect, it } from "vitest";

import {
  orderAttentionMarkets,
  remainingConfirmations,
  type AttentionMarket,
} from "./attentionQueue";

// BL-020: the confirmation backlog is ranked "by need" — oldest/most-stale suggestions first —
// and each suggestion reports how many more net confirmations it needs. These pin the pure
// ranking + arithmetic so a regression can't silently reshuffle the moderators' worklist.

describe("remainingConfirmations", () => {
  it("returns the gap when below the threshold", () => {
    expect(remainingConfirmations(1, 2)).toBe(1);
    expect(remainingConfirmations(0, 2)).toBe(2);
  });

  it("returns 0 at or above the threshold", () => {
    expect(remainingConfirmations(2, 2)).toBe(0);
    expect(remainingConfirmations(3, 2)).toBe(0);
  });

  it("counts net rejections as extra needed confirmations", () => {
    expect(remainingConfirmations(-1, 2)).toBe(3);
  });
});

function market(
  marketId: string,
  suggestions: { proposalId: string; createdAt: string }[],
): AttentionMarket {
  return {
    marketId,
    slug: marketId,
    name: marketId,
    oldestPendingAt: suggestions
      .map((s) => s.createdAt)
      .sort()[0],
    suggestions: suggestions.map((s) => ({
      proposalId: s.proposalId,
      field: "hours",
      net: 0,
      remaining: 2,
      createdAt: s.createdAt,
    })),
  };
}

describe("orderAttentionMarkets", () => {
  it("orders markets by oldest pending suggestion first", () => {
    const ordered = orderAttentionMarkets([
      market("newer", [{ proposalId: "n1", createdAt: "2026-03-01T00:00:00Z" }]),
      market("oldest", [{ proposalId: "o1", createdAt: "2026-01-01T00:00:00Z" }]),
      market("middle", [{ proposalId: "m1", createdAt: "2026-02-01T00:00:00Z" }]),
    ]);
    expect(ordered.map((m) => m.marketId)).toEqual(["oldest", "middle", "newer"]);
  });

  it("orders each market's suggestions oldest-first", () => {
    const ordered = orderAttentionMarkets([
      market("m", [
        { proposalId: "late", createdAt: "2026-02-01T00:00:00Z" },
        { proposalId: "early", createdAt: "2026-01-01T00:00:00Z" },
      ]),
    ]);
    expect(ordered[0].suggestions.map((s) => s.proposalId)).toEqual([
      "early",
      "late",
    ]);
  });

  it("ranks a market by its oldest suggestion, not its newest", () => {
    const ordered = orderAttentionMarkets([
      // Single recent suggestion.
      market("single", [{ proposalId: "s1", createdAt: "2026-01-15T00:00:00Z" }]),
      // Has a very old suggestion plus a newer one → should lead.
      market("stale", [
        { proposalId: "st1", createdAt: "2026-01-01T00:00:00Z" },
        { proposalId: "st2", createdAt: "2026-06-01T00:00:00Z" },
      ]),
    ]);
    expect(ordered.map((m) => m.marketId)).toEqual(["stale", "single"]);
  });

  it("does not mutate the input", () => {
    const input = [
      market("b", [{ proposalId: "b1", createdAt: "2026-02-01T00:00:00Z" }]),
      market("a", [{ proposalId: "a1", createdAt: "2026-01-01T00:00:00Z" }]),
    ];
    const snapshot = input.map((m) => m.marketId);
    orderAttentionMarkets(input);
    expect(input.map((m) => m.marketId)).toEqual(snapshot);
  });
});
