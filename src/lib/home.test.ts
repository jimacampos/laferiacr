import { describe, expect, it } from "vitest";

import type { Feria } from "@/data/types";

import {
  feriaHasLocation,
  feriaLetter,
  groupFeriasByLetter,
  letterFirstPage,
  letterSectionId,
  marketMapHref,
  pageCount,
  paginate,
  presentLetters,
  sortFeriasByName,
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

describe("sortFeriasByName", () => {
  it("returns a flat list in section order (A–Z then #)", () => {
    const sorted = sortFeriasByName([
      make("c", "9 de Marzo"),
      make("a", "Zapote"),
      make("b", "ávila"),
    ]);
    expect(sorted.map((f) => f.name)).toEqual(["ávila", "Zapote", "9 de Marzo"]);
  });
});

describe("pageCount", () => {
  it("computes ceil(total / perPage)", () => {
    expect(pageCount(66, 10)).toBe(7);
    expect(pageCount(10, 10)).toBe(1);
    expect(pageCount(11, 10)).toBe(2);
  });

  it("is 0 for an empty or invalid input", () => {
    expect(pageCount(0, 10)).toBe(0);
    expect(pageCount(5, 0)).toBe(0);
  });
});

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5];

  it("slices the requested 1-based page", () => {
    expect(paginate(items, 1, 2)).toEqual([1, 2]);
    expect(paginate(items, 2, 2)).toEqual([3, 4]);
    expect(paginate(items, 3, 2)).toEqual([5]);
  });

  it("yields an empty slice for out-of-range pages", () => {
    expect(paginate(items, 4, 2)).toEqual([]);
  });
});

describe("letterFirstPage", () => {
  it("maps each letter to the 1-based page of its first market", () => {
    const sorted = sortFeriasByName([
      make("a", "Alajuela"),
      make("b", "Belén"),
      make("c", "Cartago"),
      make("d", "Desamparados"),
      make("e", "Escazú"),
    ]);
    const pages = letterFirstPage(sorted, 2);
    expect(pages.get("A")).toBe(1);
    expect(pages.get("B")).toBe(1);
    expect(pages.get("C")).toBe(2);
    expect(pages.get("D")).toBe(2);
    expect(pages.get("E")).toBe(3);
  });
});
