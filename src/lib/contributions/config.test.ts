import { afterEach, describe, expect, it, vi } from "vitest";

import { captchaEnabled, confirmationThreshold } from "./config";

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
