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
}

export interface FeriasData {
  generatedAt: string;
  source: string;
  regions: Region[];
  ferias: Feria[];
}
