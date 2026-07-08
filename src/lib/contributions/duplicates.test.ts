import { describe, expect, it } from "vitest";

import {
  DUPLICATE_DISTANCE_METERS,
  DUPLICATE_NAME_THRESHOLD,
  isLikelyDuplicate,
  nameSimilarity,
  rankDuplicates,
  type DuplicateCandidate,
} from "./duplicates";

// Soft duplicate detection (Phase 5, ADR-0009): name similarity + proximity. These pin the pure
// scoring the create/check endpoints rely on to warn (never block) about likely duplicates.

describe("nameSimilarity", () => {
  it("scores identical names (after normalization) as 1", () => {
    expect(nameSimilarity("Feria de Atenas", "feria de atenas")).toBe(1);
    expect(nameSimilarity("Feria de Atenas", "FERIA DE ATENAS")).toBe(1);
  });

  it("is accent-insensitive", () => {
    expect(nameSimilarity("Feria de Puriscál", "Feria de Puriscal")).toBe(1);
  });

  it("returns 0 when either name is empty", () => {
    expect(nameSimilarity("", "Feria de Atenas")).toBe(0);
    expect(nameSimilarity("Feria", "")).toBe(0);
  });

  it("scores related feria names above the duplicate threshold", () => {
    const score = nameSimilarity(
      "Feria del Agricultor de Atenas",
      "Feria de Atenas",
    );
    expect(score).toBeGreaterThanOrEqual(DUPLICATE_NAME_THRESHOLD);
  });

  it("scores unrelated names below the duplicate threshold", () => {
    const score = nameSimilarity("Feria de Atenas", "Mercado Central Cartago");
    expect(score).toBeLessThan(DUPLICATE_NAME_THRESHOLD);
  });
});

describe("isLikelyDuplicate", () => {
  it("flags a close name regardless of distance", () => {
    expect(isLikelyDuplicate(DUPLICATE_NAME_THRESHOLD, null)).toBe(true);
    expect(isLikelyDuplicate(0.95, 9000)).toBe(true);
  });

  it("flags a nearby location even with a weak name match", () => {
    expect(isLikelyDuplicate(0.1, DUPLICATE_DISTANCE_METERS)).toBe(true);
    expect(isLikelyDuplicate(0.1, 50)).toBe(true);
  });

  it("does not flag a weak name with no/far location", () => {
    expect(isLikelyDuplicate(0.2, null)).toBe(false);
    expect(isLikelyDuplicate(0.2, DUPLICATE_DISTANCE_METERS + 1)).toBe(false);
  });
});

describe("rankDuplicates", () => {
  const make = (
    slug: string,
    nameScore: number,
    distanceMeters: number | null,
  ): DuplicateCandidate => ({
    slug,
    name: slug,
    regionName: null,
    nameScore,
    distanceMeters,
  });

  it("drops candidates that are not likely duplicates", () => {
    const ranked = rankDuplicates([
      make("keep", 0.9, null),
      make("drop", 0.1, null),
    ]);
    expect(ranked.map((c) => c.slug)).toEqual(["keep"]);
  });

  it("orders by name score, then by proximity", () => {
    const ranked = rankDuplicates([
      make("mid", 0.7, 100),
      make("best", 0.95, 400),
      make("near", 0.7, 20),
    ]);
    expect(ranked.map((c) => c.slug)).toEqual(["best", "near", "mid"]);
  });

  it("treats a missing distance as farthest when scores tie", () => {
    const ranked = rankDuplicates([
      make("noloc", 0.7, null),
      make("close", 0.7, 100),
    ]);
    expect(ranked.map((c) => c.slug)).toEqual(["close", "noloc"]);
  });
});
