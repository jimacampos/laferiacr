import { describe, expect, it } from "vitest";

import type { Feria } from "@/data/types";

import {
  countRegions,
  feriaHasLocation,
  feriaLetter,
  groupFeriasByLetter,
  letterSectionId,
  marketMapHref,
  presentLetters,
} from "./home";

const baseFeria: Feria = {
  id: "feria-central",
  name: "Feria Central",
  regionId: "san-jose",
  days: ["sat"],
  daysLabel: "Sábado",
  administrator: "Muni",
  phones: [],
};

function make(id: string, name: string, regionId = "san-jose"): Feria {
  return { ...baseFeria, id, name, regionId };
}

describe("feriaHasLocation", () => {
  it("is true only when hasLocation is explicitly true", () => {
    expect(feriaHasLocation({ ...baseFeria, hasLocation: true })).toBe(true);
    expect(feriaHasLocation({ ...baseFeria, hasLocation: false })).toBe(false);
    expect(feriaHasLocation(baseFeria)).toBe(false);
  });
});

describe("marketMapHref", () => {
  it("links to the detail page location anchor", () => {
    expect(marketMapHref(baseFeria)).toBe("/market/feria-central#location");
  });
});

describe("feriaLetter", () => {
  it("buckets accented names under the base letter", () => {
    expect(feriaLetter({ name: "Ávila" })).toBe("A");
    expect(feriaLetter({ name: "ñoco" })).toBe("N");
  });

  it("buckets non-letter starts under #", () => {
    expect(feriaLetter({ name: "10 de Marzo" })).toBe("#");
  });
});

describe("groupFeriasByLetter", () => {
  const ferias = [
    make("zapote", "Zapote"),
    make("cartago", "Cartago"),
    make("avila", "Ávila"),
    make("acosta", "Acosta"),
    make("numeric", "24 de Julio"),
  ];

  it("orders sections A→Z with # last, and sorts within each section", () => {
    const groups = groupFeriasByLetter(ferias);
    expect(groups.map((g) => g.letter)).toEqual(["A", "C", "Z", "#"]);
    expect(groups[0].ferias.map((f) => f.id)).toEqual(["acosta", "avila"]);
  });

  it("omits empty letters", () => {
    const groups = groupFeriasByLetter([make("bagaces", "Bagaces")]);
    expect(groups.map((g) => g.letter)).toEqual(["B"]);
  });

  it("does not mutate the input array", () => {
    const input = [make("b", "B"), make("a", "A")];
    const snapshot = input.map((f) => f.id);
    groupFeriasByLetter(input);
    expect(input.map((f) => f.id)).toEqual(snapshot);
  });
});

describe("presentLetters", () => {
  it("returns the set of letters that have markets", () => {
    const groups = groupFeriasByLetter([make("a", "Acosta"), make("z", "Zapote")]);
    const letters = presentLetters(groups);
    expect(letters.has("A")).toBe(true);
    expect(letters.has("Z")).toBe(true);
    expect(letters.has("B")).toBe(false);
  });
});

describe("letterSectionId", () => {
  it("slugs letters and the non-alpha bucket", () => {
    expect(letterSectionId("A")).toBe("letter-A");
    expect(letterSectionId("#")).toBe("letter-num");
  });
});

describe("countRegions", () => {
  it("counts distinct regions", () => {
    expect(
      countRegions([
        make("a", "A", "san-jose"),
        make("b", "B", "san-jose"),
        make("c", "C", "cartago"),
      ]),
    ).toBe(2);
  });

  it("is 0 for an empty list", () => {
    expect(countRegions([])).toBe(0);
  });
});
