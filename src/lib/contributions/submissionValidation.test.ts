import { describe, expect, it } from "vitest";

import { validateSubmission } from "./validation";

// validateSubmission is the server-side gate on new-market submissions (Phase 5). Sign-in is
// enforced by the route; these pin the accepted shape and the 400 rejection codes.

const base = {
  name: "Feria de Naranjo",
  regionId: "alajuela",
  regionName: "Alajuela",
  days: ["sat"],
};

describe("validateSubmission — required fields", () => {
  it("rejects non-objects", () => {
    expect(validateSubmission(null)).toEqual({ ok: false, error: "invalid_body" });
    expect(validateSubmission("nope")).toEqual({
      ok: false,
      error: "invalid_body",
    });
  });

  it("rejects a missing name", () => {
    expect(validateSubmission({ ...base, name: "  " })).toEqual({
      ok: false,
      error: "invalid_name",
    });
  });

  it("rejects a missing region", () => {
    expect(validateSubmission({ ...base, regionId: "" })).toEqual({
      ok: false,
      error: "invalid_region",
    });
  });

  it("rejects empty or unknown days", () => {
    expect(validateSubmission({ ...base, days: [] })).toEqual({
      ok: false,
      error: "invalid_days",
    });
    expect(validateSubmission({ ...base, days: ["funday"] })).toEqual({
      ok: false,
      error: "invalid_days",
    });
  });
});

describe("validateSubmission — accepted shapes", () => {
  it("accepts a minimal valid submission and canonicalizes days", () => {
    const result = validateSubmission({ ...base, days: ["sun", "sat", "sat"] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Feria de Naranjo");
      // De-duplicated and sorted into week order.
      expect(result.value.days).toEqual(["sat", "sun"]);
      expect(result.value.location).toBeNull();
      expect(result.value.phones).toEqual([]);
    }
  });

  it("accepts optional fields and a valid location", () => {
    const result = validateSubmission({
      ...base,
      hoursText: "6am–1pm",
      referenceText: "Contiguo al Palí",
      mapUrl: "https://maps.google.com/x",
      organizer: "Centro Agrícola",
      phones: ["2450-0000", ""],
      location: { lat: 10.09, lng: -84.38 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.mapUrl).toBe("https://maps.google.com/x");
      expect(result.value.phones).toEqual(["2450-0000"]);
      expect(result.value.location).toEqual({ lat: 10.09, lng: -84.38 });
    }
  });
});

describe("validateSubmission — optional field validation", () => {
  it("rejects a non-http map url", () => {
    expect(validateSubmission({ ...base, mapUrl: "javascript:alert(1)" })).toEqual(
      { ok: false, error: "invalid_map_url" },
    );
  });

  it("rejects an out-of-range location", () => {
    const result = validateSubmission({
      ...base,
      location: { lat: 999, lng: -84 },
    });
    expect(result.ok).toBe(false);
  });
});
