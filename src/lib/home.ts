import type { Feria } from "@/data/types";

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

/** i18n key for the hero market count: singular vs plural. */
export function marketCountKey(count: number): "hero.count.one" | "hero.count.many" {
  return count === 1 ? "hero.count.one" : "hero.count.many";
}
