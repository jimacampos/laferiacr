import { describe, expect, it } from "vitest";

import type { Feria } from "@/data/types";
import { dictionaries, LANGUAGES } from "@/i18n/dictionaries";

import { feriaHasLocation, marketCountKey, marketMapHref } from "./home";

const baseFeria: Feria = {
  id: "feria-central",
  name: "Feria Central",
  regionId: "san-jose",
  days: ["sat"],
  daysLabel: "Sábado",
  administrator: "Muni",
  phones: [],
};

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

describe("marketCountKey", () => {
  it("selects singular vs plural", () => {
    expect(marketCountKey(1)).toBe("hero.count.one");
    expect(marketCountKey(0)).toBe("hero.count.many");
    expect(marketCountKey(66)).toBe("hero.count.many");
  });

  it("resolves to non-empty copy in each language", () => {
    for (const lang of LANGUAGES) {
      const messages = dictionaries[lang];
      for (const key of ["hero.count.one", "hero.count.many"] as const) {
        expect(messages[key]?.trim(), `${lang}:${key}`).toBeTruthy();
      }
    }
  });
});
