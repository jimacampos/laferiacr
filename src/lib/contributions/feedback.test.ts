import { describe, expect, it } from "vitest";

import { FEEDBACK_MAX_LENGTH } from "./config";
import { isFeedbackStatus, validateFeedback } from "./feedback";

// Pure validation for the sign-in-only feedback channel. These pin the trimming,
// length bounds, page-url handling, and the status guard used by the admin route.

describe("validateFeedback", () => {
  it("accepts a normal message and trims it", () => {
    const res = validateFeedback("  hello there  ");
    expect(res).toEqual({ ok: true, message: "hello there", pageUrl: null });
  });

  it("rejects a non-string message", () => {
    expect(validateFeedback(42)).toEqual({ ok: false, error: "invalid_message" });
    expect(validateFeedback(undefined)).toEqual({
      ok: false,
      error: "invalid_message",
    });
  });

  it("rejects an empty or whitespace-only message", () => {
    expect(validateFeedback("")).toEqual({ ok: false, error: "invalid_message" });
    expect(validateFeedback("   ")).toEqual({
      ok: false,
      error: "invalid_message",
    });
  });

  it("rejects a message over the max length", () => {
    const tooLong = "a".repeat(FEEDBACK_MAX_LENGTH + 1);
    expect(validateFeedback(tooLong)).toEqual({
      ok: false,
      error: "invalid_message",
    });
  });

  it("accepts a message exactly at the max length", () => {
    const atLimit = "a".repeat(FEEDBACK_MAX_LENGTH);
    const res = validateFeedback(atLimit);
    expect(res.ok).toBe(true);
  });

  it("keeps a valid page url and clamps a very long one", () => {
    const ok = validateFeedback("hi", "/help?x=1");
    expect(ok).toEqual({ ok: true, message: "hi", pageUrl: "/help?x=1" });

    const long = validateFeedback("hi", "/p?" + "q".repeat(1000));
    expect(long.ok).toBe(true);
    if (long.ok) expect(long.pageUrl?.length).toBe(500);
  });

  it("drops an empty or non-string page url", () => {
    expect(validateFeedback("hi", "")).toMatchObject({ pageUrl: null });
    expect(validateFeedback("hi", 123)).toMatchObject({ pageUrl: null });
  });
});

describe("isFeedbackStatus", () => {
  it("accepts the three known statuses", () => {
    expect(isFeedbackStatus("open")).toBe(true);
    expect(isFeedbackStatus("reviewed")).toBe(true);
    expect(isFeedbackStatus("archived")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isFeedbackStatus("deleted")).toBe(false);
    expect(isFeedbackStatus("")).toBe(false);
    expect(isFeedbackStatus(null)).toBe(false);
    expect(isFeedbackStatus(3)).toBe(false);
  });
});
