// Pure slug generation for community-added markets (Phase 5). Mirrors the v0 seed slug style
// (accent-stripped, lowercase, hyphenated — e.g. "Aurora- Alajuelita" → "aurora-alajuelita").
// Uniqueness against existing slugs is resolved in submissions.ts; this module stays pure.

/** Turn a market name into a URL-safe slug base (may collide; caller de-duplicates). */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Pick the first slug not already taken: `base`, then `base-2`, `base-3`, … Pure so the
 * collision rule is unit-testable; the caller supplies the set of existing slugs.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || "feria";
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
