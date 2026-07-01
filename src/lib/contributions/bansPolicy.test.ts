import { describe, expect, it } from "vitest";

import {
  BAN_DURATIONS,
  banExpiry,
  isBanActive,
  isBanDuration,
} from "./bansPolicy";

// Temp-bans block all writes (Phase 4, ADR-0014). These pin the pure duration + active-window
// math; the DB helpers in bans.ts (createBan/liftBan/activeBan) build on this.

const BASE = new Date("2026-01-01T00:00:00.000Z");

describe("isBanDuration", () => {
  it("accepts the supported presets", () => {
    for (const key of Object.keys(BAN_DURATIONS)) {
      expect(isBanDuration(key)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    expect(isBanDuration("2d")).toBe(false);
    expect(isBanDuration("")).toBe(false);
    expect(isBanDuration(7)).toBe(false);
    expect(isBanDuration(null)).toBe(false);
  });
});

describe("banExpiry", () => {
  it("adds the preset window to the start time", () => {
    expect(banExpiry("1d", BASE)?.toISOString()).toBe("2026-01-02T00:00:00.000Z");
    expect(banExpiry("7d", BASE)?.toISOString()).toBe("2026-01-08T00:00:00.000Z");
    expect(banExpiry("30d", BASE)?.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  it("is null (no expiry) for a permanent ban", () => {
    expect(banExpiry("permanent", BASE)).toBeNull();
  });
});

describe("isBanActive", () => {
  it("is active before expiry and inactive after", () => {
    const expiresAt = banExpiry("7d", BASE);
    expect(isBanActive({ expiresAt, liftedAt: null }, BASE)).toBe(true);
    const later = new Date(BASE.getTime() + 8 * 24 * 60 * 60 * 1000);
    expect(isBanActive({ expiresAt, liftedAt: null }, later)).toBe(false);
  });

  it("treats a null expiry as a permanent, always-active ban", () => {
    const far = new Date("2099-01-01T00:00:00.000Z");
    expect(isBanActive({ expiresAt: null, liftedAt: null }, far)).toBe(true);
  });

  it("is inactive once lifted early, even before expiry", () => {
    const expiresAt = banExpiry("30d", BASE);
    expect(
      isBanActive({ expiresAt, liftedAt: BASE }, BASE),
    ).toBe(false);
  });

  it("is inactive exactly at the expiry boundary", () => {
    const expiresAt = banExpiry("1d", BASE);
    expect(isBanActive({ expiresAt, liftedAt: null }, expiresAt!)).toBe(false);
  });
});
