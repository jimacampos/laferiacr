import { describe, expect, it } from "vitest";

import { highlightSegments } from "./search";

function join(name: string, query: string): string {
  return highlightSegments(name, query)
    .map((s) => (s.match ? `[${s.text}]` : s.text))
    .join("");
}

describe("highlightSegments", () => {
  it("returns a single non-matching segment for an empty query", () => {
    expect(highlightSegments("Feria de Cartago", "")).toEqual([
      { text: "Feria de Cartago", match: false },
    ]);
  });

  it("wraps the matched run, preserving surrounding text", () => {
    expect(join("Feria de Cartago", "cart")).toBe("Feria de [Cart]ago");
  });

  it("matches accent-insensitively and slices the original (accented) text", () => {
    expect(join("Feria de Pérez Zeledón", "perez")).toBe(
      "Feria de [Pérez] Zeledón",
    );
  });

  it("matches at the start of the name", () => {
    expect(join("Zapote", "zap")).toBe("[Zap]ote");
  });

  it("matches at the very end of the name", () => {
    expect(join("Zapote", "ote")).toBe("Zap[ote]");
  });

  it("returns one non-matching segment when there is no match", () => {
    expect(highlightSegments("Zapote", "xyz")).toEqual([
      { text: "Zapote", match: false },
    ]);
  });
});
