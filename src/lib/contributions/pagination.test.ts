import { describe, expect, it } from "vitest";

import { pageBounds } from "./pagination";

describe("pageBounds", () => {
  it("computes the window for a full first page", () => {
    expect(pageBounds(25, 1, 10)).toEqual({ totalPages: 3, from: 1, to: 10 });
  });

  it("computes the window for a middle page", () => {
    expect(pageBounds(25, 2, 10)).toEqual({ totalPages: 3, from: 11, to: 20 });
  });

  it("caps `to` at total on a partial last page", () => {
    expect(pageBounds(25, 3, 10)).toEqual({ totalPages: 3, from: 21, to: 25 });
  });

  it("returns a zeroed window when there are no items", () => {
    expect(pageBounds(0, 1, 10)).toEqual({ totalPages: 1, from: 0, to: 0 });
  });

  it("handles an exact multiple of page size", () => {
    expect(pageBounds(20, 2, 10)).toEqual({ totalPages: 2, from: 11, to: 20 });
  });

  it("clamps a page above the range down to the last page", () => {
    expect(pageBounds(25, 99, 10)).toEqual({ totalPages: 3, from: 21, to: 25 });
  });

  it("clamps a non-positive page up to the first page", () => {
    expect(pageBounds(25, 0, 10)).toEqual({ totalPages: 3, from: 1, to: 10 });
  });

  it("guards against a non-positive page size", () => {
    expect(pageBounds(5, 1, 0)).toEqual({ totalPages: 5, from: 1, to: 1 });
  });
});
