import { describe, expect, it } from "vitest";

import type { Feria } from "@/data/types";

import {
  DEFAULT_FILTERS,
  filterFerias,
  hasActiveFilters,
  normalizeText,
} from "./filters";

const ferias: Feria[] = [
  {
    id: "perez-zeledon",
    name: "Feria de Pérez Zeledón",
    regionId: "brunca",
    days: ["sat"],
    daysLabel: "Sábado",
    administrator: "Muni",
    phones: [],
  },
  {
    id: "cartago",
    name: "Feria de Cartago",
    regionId: "central",
    days: ["fri", "sat"],
    daysLabel: "Viernes y sábado",
    administrator: "Muni",
    phones: [],
  },
  {
    id: "liberia",
    name: "Feria de Liberia",
    regionId: "chorotega",
    days: ["wed"],
    daysLabel: "Miércoles",
    administrator: "Muni",
    phones: [],
  },
];

describe("normalizeText", () => {
  it("strips accents and lowercases", () => {
    expect(normalizeText("Pérez Zeledón")).toBe("perez zeledon");
  });
});

describe("DEFAULT_FILTERS", () => {
  it("no longer defaults to a weekend-only view (BL-025)", () => {
    expect(DEFAULT_FILTERS.day).toBe("all");
  });

  it("returns every market by default", () => {
    expect(filterFerias(ferias, DEFAULT_FILTERS)).toHaveLength(ferias.length);
  });
});

describe("filterFerias — name search", () => {
  it("matches names accent-insensitively", () => {
    const result = filterFerias(ferias, { ...DEFAULT_FILTERS, query: "perez" });
    expect(result.map((f) => f.id)).toEqual(["perez-zeledon"]);
  });

  it("matches on a partial, mixed-case query", () => {
    const result = filterFerias(ferias, { ...DEFAULT_FILTERS, query: "CARTA" });
    expect(result.map((f) => f.id)).toEqual(["cartago"]);
  });

  it("returns nothing for a non-matching query", () => {
    expect(
      filterFerias(ferias, { ...DEFAULT_FILTERS, query: "nowhere" }),
    ).toHaveLength(0);
  });

  it("still supports the optional day filter", () => {
    const result = filterFerias(ferias, { ...DEFAULT_FILTERS, day: "wed" });
    expect(result.map((f) => f.id)).toEqual(["liberia"]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the defaults", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it("is true once a query is set", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: "feria" })).toBe(true);
  });

  it("is true once a specific day is chosen", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, day: "sat" })).toBe(true);
  });
});
