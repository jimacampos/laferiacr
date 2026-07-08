export const DAYS_OF_WEEK = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/** Days considered part of "the weekend" for the default view. */
export const WEEKEND_DAYS: readonly DayOfWeek[] = ["fri", "sat", "sun"];

export interface Region {
  id: string;
  name: string;
}

export interface Feria {
  id: string;
  name: string;
  regionId: string;
  /** Canonical day-of-week keys the market operates, in week order. */
  days: DayOfWeek[];
  /** Original Spanish day label from the source data. */
  daysLabel: string;
  administrator: string;
  phones: string[];
  /** Human-readable operating hours from the official source; null when unknown. */
  hoursText?: string | null;
  /**
   * Landmark-based point-of-reference direction (e.g. "Contiguo al Pali"); null when
   * unknown. Costa Rican addresses are landmark-based, so this often locates a feria
   * better than coordinates alone.
   */
  referenceText?: string | null;
  /** Google Maps link to the feria's location; null until provided. */
  mapUrl?: string | null;
  /**
   * Whether the market has known coordinates. Drives the name-first card's
   * lightweight 📍 indicator (Phase 4.5); true only when a location exists.
   * Optional so the static v0 dataset (no coordinates) stays valid.
   */
  hasLocation?: boolean;
}

export interface FeriasData {
  generatedAt: string;
  source: string;
  regions: Region[];
  ferias: Feria[];
}
