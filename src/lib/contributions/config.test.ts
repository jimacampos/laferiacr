import { afterEach, describe, expect, it, vi } from "vitest";

import {
  captchaEnabled,
  confirmationThreshold,
  parseThreshold,
  resolveThreshold,
} from "./config";

// Config reads operator-tunable policy from the environment with safe defaults so the app
// runs unconfigured on dev. These pin the defaults and the parsing guards.

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("confirmationThreshold", () => {
  it("defaults to 2 (OQ-001) when unset", () => {
    vi.stubEnv("CONFIRMATION_THRESHOLD", "");
    expect(confirmationThreshold()).toBe(2);
  });

  it("honors a valid positive override", () => {
    vi.stubEnv("CONFIRMATION_THRESHOLD", "3");
    expect(confirmationThreshold()).toBe(3);
  });

  it("falls back to 2 for non-numeric or non-positive values", () => {
    vi.stubEnv("CONFIRMATION_THRESHOLD", "abc");
    expect(confirmationThreshold()).toBe(2);
    vi.stubEnv("CONFIRMATION_THRESHOLD", "0");
    expect(confirmationThreshold()).toBe(2);
    vi.stubEnv("CONFIRMATION_THRESHOLD", "-1");
    expect(confirmationThreshold()).toBe(2);
  });
});

describe("captchaEnabled", () => {
  it("is off unless explicitly enabled (default off on dev)", () => {
    vi.stubEnv("CAPTCHA_ENABLED", "");
    expect(captchaEnabled()).toBe(false);
    vi.stubEnv("CAPTCHA_ENABLED", "false");
    expect(captchaEnabled()).toBe(false);
  });

  it("is on only for the exact string 'true'", () => {
    vi.stubEnv("CAPTCHA_ENABLED", "true");
    expect(captchaEnabled()).toBe(true);
  });
});

describe("parseThreshold", () => {
  it("parses a positive integer", () => {
    expect(parseThreshold("3")).toBe(3);
  });

  it("returns null for absent, non-numeric, or non-positive input", () => {
    expect(parseThreshold(null)).toBeNull();
    expect(parseThreshold(undefined)).toBeNull();
    expect(parseThreshold("")).toBeNull();
    expect(parseThreshold("abc")).toBeNull();
    expect(parseThreshold("0")).toBeNull();
    expect(parseThreshold("-2")).toBeNull();
  });
});

describe("resolveThreshold (Phase 4: DB → env → default)", () => {
  it("prefers a valid DB value over env and default", () => {
    expect(resolveThreshold("5", "3")).toBe(5);
  });

  it("falls back to env when the DB value is absent or invalid", () => {
    expect(resolveThreshold(null, "3")).toBe(3);
    expect(resolveThreshold("bad", "3")).toBe(3);
    expect(resolveThreshold("0", "4")).toBe(4);
  });

  it("falls back to the built-in default when neither is valid", () => {
    expect(resolveThreshold(null, null)).toBe(2);
    expect(resolveThreshold("nope", "-1")).toBe(2);
  });
});
