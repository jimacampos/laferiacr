// Pure, dependency-free duplicate-detection scoring for community-submitted markets (Phase 5,
// ADR-0009). Kept free of prisma/server imports so it is unit-testable and client-safe; the
// DB-backed candidate lookup (name + PostGIS proximity) lives in submissions.ts and feeds these
// helpers. Detection is a **soft warning** only — the caller surfaces likely duplicates but never
// blocks the submission.

import { normalizeText } from "@/lib/filters";

/** Name-similarity at/above which two markets are considered a likely duplicate. */
export const DUPLICATE_NAME_THRESHOLD = 0.6;

/** Proximity (meters) within which a nearby market is treated as a likely duplicate. */
export const DUPLICATE_DISTANCE_METERS = 500;

/** Character bigrams of a normalized string (spaces collapsed), for Dice similarity. */
function bigrams(value: string): string[] {
  const cleaned = normalizeText(value).replace(/\s+/g, " ").trim();
  const grams: string[] = [];
  for (let i = 0; i < cleaned.length - 1; i += 1) {
    grams.push(cleaned.slice(i, i + 2));
  }
  return grams;
}

/**
 * Sørensen–Dice similarity of two names in [0,1], accent- and case-insensitive. 1 = identical
 * (after normalization); 0 = no shared bigrams. Robust to minor spelling/spacing differences,
 * which suits Costa Rican feria names ("Feria del Agricultor de Atenas" vs "Feria de Atenas").
 */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeText(a).replace(/\s+/g, " ").trim();
  const nb = normalizeText(b).replace(/\s+/g, " ").trim();
  if (na.length === 0 || nb.length === 0) return 0;
  if (na === nb) return 1;

  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  if (aGrams.length === 0 || bGrams.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const g of aGrams) counts.set(g, (counts.get(g) ?? 0) + 1);

  let matches = 0;
  for (const g of bGrams) {
    const c = counts.get(g) ?? 0;
    if (c > 0) {
      matches += 1;
      counts.set(g, c - 1);
    }
  }
  return (2 * matches) / (aGrams.length + bGrams.length);
}

/**
 * Whether a candidate is a likely duplicate: a close name OR (when both have coordinates) a
 * nearby location. Distance is only considered when provided (submissions may omit a pin).
 */
export function isLikelyDuplicate(
  nameScore: number,
  distanceMeters: number | null,
): boolean {
  if (nameScore >= DUPLICATE_NAME_THRESHOLD) return true;
  if (distanceMeters !== null && distanceMeters <= DUPLICATE_DISTANCE_METERS) {
    return true;
  }
  return false;
}

/** A market considered as a possible duplicate of a submission. */
export interface DuplicateCandidate {
  slug: string;
  name: string;
  regionName: string | null;
  /** Name-similarity score in [0,1]. */
  nameScore: number;
  /** Meters from the submission's pin, when both have coordinates; null otherwise. */
  distanceMeters: number | null;
}

/**
 * Rank likely-duplicate candidates: closest name first, then nearest location. Callers pass
 * markets already scored against the submission; this only orders and filters them.
 */
export function rankDuplicates(
  candidates: DuplicateCandidate[],
): DuplicateCandidate[] {
  return candidates
    .filter((c) => isLikelyDuplicate(c.nameScore, c.distanceMeters))
    .sort(
      (a, b) =>
        b.nameScore - a.nameScore ||
        (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
    );
}
