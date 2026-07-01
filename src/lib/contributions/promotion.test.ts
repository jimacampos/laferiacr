import { describe, expect, it } from "vitest";

import {
  netConfirmations,
  remainingConfirmations,
  shouldPromote,
} from "./promotion";

// The promotion rule is the trust-critical heart of the contribution loop (ADR-0008): a
// proposal auto-promotes at N=2 *net* confirmations. These cover the pure decision extracted
// from the transactional castVote.

describe("netConfirmations", () => {
  it("is confirmations minus rejections", () => {
    expect(netConfirmations({ confirmCount: 3, rejectCount: 1 })).toBe(2);
  });

  it("can go negative when rejections lead", () => {
    expect(netConfirmations({ confirmCount: 1, rejectCount: 4 })).toBe(-3);
  });

  it("is zero for a fresh proposal", () => {
    expect(netConfirmations({ confirmCount: 0, rejectCount: 0 })).toBe(0);
  });
});

describe("shouldPromote", () => {
  const N = 2;

  it("does not promote below the threshold", () => {
    expect(shouldPromote({ confirmCount: 1, rejectCount: 0 }, N)).toBe(false);
  });

  it("promotes exactly at the threshold", () => {
    expect(shouldPromote({ confirmCount: 2, rejectCount: 0 }, N)).toBe(true);
  });

  it("promotes above the threshold", () => {
    expect(shouldPromote({ confirmCount: 5, rejectCount: 1 }, N)).toBe(true);
  });

  it("uses NET votes, so rejections hold back promotion", () => {
    // 2 confirms but 1 reject → net 1 < 2 → stays pending.
    expect(shouldPromote({ confirmCount: 2, rejectCount: 1 }, N)).toBe(false);
  });

  it("never promotes a net-negative proposal", () => {
    expect(shouldPromote({ confirmCount: 0, rejectCount: 3 }, N)).toBe(false);
  });

  it("honors a configured higher threshold", () => {
    expect(shouldPromote({ confirmCount: 2, rejectCount: 0 }, 3)).toBe(false);
    expect(shouldPromote({ confirmCount: 3, rejectCount: 0 }, 3)).toBe(true);
  });
});

describe("remainingConfirmations", () => {
  it("counts down toward the threshold", () => {
    expect(remainingConfirmations({ confirmCount: 0, rejectCount: 0 }, 2)).toBe(2);
    expect(remainingConfirmations({ confirmCount: 1, rejectCount: 0 }, 2)).toBe(1);
  });

  it("is zero once the threshold is met (never negative)", () => {
    expect(remainingConfirmations({ confirmCount: 2, rejectCount: 0 }, 2)).toBe(0);
    expect(remainingConfirmations({ confirmCount: 5, rejectCount: 0 }, 2)).toBe(0);
  });

  it("accounts for rejections increasing what's needed", () => {
    // net = 1 − 2 = −1, threshold 2 → need 3 more net confirmations.
    expect(remainingConfirmations({ confirmCount: 1, rejectCount: 2 }, 2)).toBe(3);
  });
});
