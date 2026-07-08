import { describe, expect, it } from "vitest";

import { slugify, uniqueSlug } from "./slug";

// Slug generation for community-added markets (Phase 5). Mirrors the v0 seed slug style and the
// collision rule the promotion transaction relies on to create a unique market row.

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Feria de Atenas")).toBe("feria-de-atenas");
  });

  it("strips accents", () => {
    expect(slugify("Feria de Puriscál")).toBe("feria-de-puriscal");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(slugify("  Aurora-- Alajuelita  ")).toBe("aurora-alajuelita");
  });

  it("drops punctuation and symbols", () => {
    expect(slugify("Feria #1 (Centro)!")).toBe("feria-1-centro");
  });

  it("returns an empty string when nothing survives normalization", () => {
    expect(slugify("¡!@#")).toBe("");
  });
});

describe("uniqueSlug", () => {
  it("returns the base when it is free", () => {
    expect(uniqueSlug("atenas", new Set())).toBe("atenas");
  });

  it("suffixes with -2 on the first collision", () => {
    expect(uniqueSlug("atenas", new Set(["atenas"]))).toBe("atenas-2");
  });

  it("skips taken suffixes to the next free number", () => {
    expect(
      uniqueSlug("atenas", new Set(["atenas", "atenas-2", "atenas-3"])),
    ).toBe("atenas-4");
  });

  it("falls back to 'feria' when the base is empty", () => {
    expect(uniqueSlug("", new Set())).toBe("feria");
    expect(uniqueSlug("", new Set(["feria"]))).toBe("feria-2");
  });
});
