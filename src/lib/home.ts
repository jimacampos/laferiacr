import type { Feria } from "@/data/types";

import { normalizeText } from "./filters";

// Pure, client-safe helpers for the name-first home (Phase 4.5, BL-023/BL-024). Kept
// framework-free so they can be unit-tested and shared by the Hero and MarketCard
// components. Copy lives in dictionaries.ts; these only compute values, not markup.

/** True when a market has known coordinates (drives the card's 📍 indicator). */
export function feriaHasLocation(feria: Pick<Feria, "hasLocation">): boolean {
  return feria.hasLocation === true;
}

/** Deep link to a market's map on its detail page (the location section anchor). */
export function marketMapHref(feria: Pick<Feria, "id">): string {
  return `/market/${feria.id}#location`;
}

/** The A–Z buckets the alphabetical index can offer, in order (non-letters fall under "#"). */
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NON_ALPHA_LETTER = "#";

/** Accent-insensitive first letter used to bucket a market by name (e.g. "Ávila" → "A"). */
export function feriaLetter(feria: Pick<Feria, "name">): string {
  const first = normalizeText(feria.name).charAt(0).toUpperCase();
  return first >= "A" && first <= "Z" ? first : NON_ALPHA_LETTER;
}

/** One alphabetical section: a letter heading and the markets that fall under it. */
export interface LetterGroup {
  letter: string;
  ferias: Feria[];
}

/**
 * Group markets into alphabetical sections for the name-first directory. Sections and the
 * markets within them are sorted accent-insensitively by name; non-letter names bucket last
 * under "#". Empty letters are omitted so the list only renders sections that have markets.
 */
export function groupFeriasByLetter(ferias: Feria[]): LetterGroup[] {
  const buckets = new Map<string, Feria[]>();
  for (const feria of ferias) {
    const letter = feriaLetter(feria);
    const bucket = buckets.get(letter);
    if (bucket) bucket.push(feria);
    else buckets.set(letter, [feria]);
  }

  const order = [...ALPHABET, NON_ALPHA_LETTER];
  return order
    .filter((letter) => buckets.has(letter))
    .map((letter) => ({
      letter,
      ferias: buckets
        .get(letter)!
        .slice()
        .sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name))),
    }));
}

/** Set of letters that have at least one market (drives the A–Z index enabled state). */
export function presentLetters(groups: LetterGroup[]): Set<string> {
  return new Set(groups.map((group) => group.letter));
}

/** DOM id for a letter section, used for the A–Z jump anchors ("#" → a safe slug). */
export function letterSectionId(letter: string): string {
  return letter === NON_ALPHA_LETTER ? "letter-num" : `letter-${letter}`;
}

/** Count of distinct regions represented, for the hero stats line. */
export function countRegions(ferias: Pick<Feria, "regionId">[]): number {
  return new Set(ferias.map((feria) => feria.regionId)).size;
}

