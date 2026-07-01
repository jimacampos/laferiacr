import { describe, expect, it } from "vitest";

import { HOURS_MAX_LENGTH } from "./config";
import { validateProposal } from "./validation";

// validateProposal is the server-side gate on anonymous, untrusted proposal input. These
// pin down the accepted shapes and the rejection codes the API relies on (400s).

describe("validateProposal — body shape", () => {
  it("rejects non-objects", () => {
    expect(validateProposal(null)).toEqual({ ok: false, error: "invalid_body" });
    expect(validateProposal("nope")).toEqual({ ok: false, error: "invalid_body" });
  });

  it("rejects an unknown field", () => {
    expect(validateProposal({ field: "phone", value: "x" })).toEqual({
      ok: false,
      error: "invalid_field",
    });
  });
});

describe("validateProposal — hours", () => {
  it("accepts and trims a valid string", () => {
    expect(validateProposal({ field: "hours", value: "  6am–1pm  " })).toEqual({
      ok: true,
      field: "hours",
      value: "6am–1pm",
    });
  });

  it("rejects an empty / whitespace-only value", () => {
    expect(validateProposal({ field: "hours", value: "   " })).toEqual({
      ok: false,
      error: "invalid_value",
    });
  });

  it("rejects a non-string value", () => {
    expect(validateProposal({ field: "hours", value: 42 })).toEqual({
      ok: false,
      error: "invalid_value",
    });
  });

  it("rejects a value past the max length", () => {
    const tooLong = "a".repeat(HOURS_MAX_LENGTH + 1);
    expect(validateProposal({ field: "hours", value: tooLong })).toEqual({
      ok: false,
      error: "invalid_value",
    });
  });
});

describe("validateProposal — location", () => {
  it("accepts a point inside Costa Rica and rounds to ~5dp", () => {
    const result = validateProposal({
      field: "location",
      value: { lat: 9.9325123456, lng: -84.1002987654 },
    });
    expect(result).toEqual({
      ok: true,
      field: "location",
      value: { lat: 9.93251, lng: -84.1003 },
    });
  });

  it("rejects a point outside the Costa Rica bounds", () => {
    // Roughly London — well outside the CR bounding box.
    expect(
      validateProposal({ field: "location", value: { lat: 51.5, lng: -0.12 } }),
    ).toEqual({ ok: false, error: "out_of_bounds" });
  });

  it("rejects non-numeric coordinates", () => {
    expect(
      validateProposal({ field: "location", value: { lat: "9.9", lng: -84 } }),
    ).toEqual({ ok: false, error: "invalid_value" });
  });

  it("rejects non-finite coordinates", () => {
    expect(
      validateProposal({
        field: "location",
        value: { lat: Number.NaN, lng: -84 },
      }),
    ).toEqual({ ok: false, error: "invalid_value" });
  });

  it("rejects a missing value object", () => {
    expect(validateProposal({ field: "location", value: null })).toEqual({
      ok: false,
      error: "invalid_value",
    });
  });
});
