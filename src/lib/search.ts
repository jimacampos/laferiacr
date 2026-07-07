import { normalizeText } from "./filters";

// Pure, client-safe helper for name-first search highlighting (Phase 4.5). Splits a market
// name into segments around the accent-insensitive match of the current query so the UI can
// wrap matched runs in <mark> without doing any matching logic itself.

/** A run of text within a name, flagged when it corresponds to the search match. */
export interface HighlightSegment {
  text: string;
  match: boolean;
}

/**
 * Fold a name for matching while keeping index alignment with the original string: lowercase
 * and strip accents, but do NOT trim. Decomposing then removing combining marks collapses each
 * accented Latin letter back to a single base character at its original position, so offsets in
 * the folded string map 1:1 onto the source text (unlike `normalizeText`, which trims).
 */
function foldForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Split `name` into highlight segments around the first accent-insensitive occurrence of
 * `query`. Returns a single non-matching segment when the query is empty or absent so callers
 * can render uniformly.
 */
export function highlightSegments(name: string, query: string): HighlightSegment[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [{ text: name, match: false }];

  const foldedName = foldForMatch(name);
  const start = foldedName.indexOf(normalizedQuery);
  if (start === -1) return [{ text: name, match: false }];

  const end = start + normalizedQuery.length;
  const segments: HighlightSegment[] = [];
  if (start > 0) segments.push({ text: name.slice(0, start), match: false });
  segments.push({ text: name.slice(start, end), match: true });
  if (end < name.length) segments.push({ text: name.slice(end), match: false });
  return segments;
}
