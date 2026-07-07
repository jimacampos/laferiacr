import { DAYS_OF_WEEK, WEEKEND_DAYS, type DayOfWeek, type Feria } from "@/data/types";

/** A day selection in the filter UI: every day, the weekend, or one specific day. */
export type DaySelection = "all" | "weekend" | DayOfWeek;

/** A region selection in the filter UI: every region or one specific region id. */
export type RegionSelection = "all" | string;

export interface FeriaFilters {
  day: DaySelection;
  regionId: RegionSelection;
  query: string;
}

export const DEFAULT_FILTERS: FeriaFilters = {
  day: "all",
  regionId: "all",
  query: "",
};

/** Lowercase and strip accents so search matches "Pérez" with "perez". */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function feriaMatchesDay(feria: Feria, day: DaySelection): boolean {
  if (day === "all") return true;
  if (day === "weekend") {
    return feria.days.some((d) => WEEKEND_DAYS.includes(d));
  }
  return feria.days.includes(day);
}

export function filterFerias(ferias: Feria[], filters: FeriaFilters): Feria[] {
  const query = normalizeText(filters.query);
  return ferias.filter((feria) => {
    if (!feriaMatchesDay(feria, filters.day)) return false;
    if (filters.regionId !== "all" && feria.regionId !== filters.regionId) {
      return false;
    }
    if (query && !normalizeText(feria.name).includes(query)) return false;
    return true;
  });
}

/** Day-of-week keys that actually appear in the data, in week order. */
export function getAvailableDays(ferias: Feria[]): DayOfWeek[] {
  const present = new Set<DayOfWeek>();
  for (const feria of ferias) {
    for (const day of feria.days) present.add(day);
  }
  return DAYS_OF_WEEK.filter((day) => present.has(day));
}

export function hasActiveFilters(filters: FeriaFilters): boolean {
  return (
    filters.day !== DEFAULT_FILTERS.day ||
    filters.regionId !== DEFAULT_FILTERS.regionId ||
    filters.query.trim() !== ""
  );
}

/** Strip non-digit characters so a "tel:" link works regardless of formatting. */
export function phoneToTelHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
