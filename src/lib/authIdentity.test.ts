import { describe, expect, it } from "vitest";

import { resolveIdentity } from "./authIdentity";

describe("resolveIdentity", () => {
  it("reuses the existing row when a verified email already maps to one", () => {
    expect(
      resolveIdentity({ email: "a@example.com", existingByEmail: { id: "u1" } }),
    ).toEqual({ kind: "reuse", userId: "u1" });
  });

  it("upserts by external id when the email is new (no prior row)", () => {
    expect(
      resolveIdentity({ email: "new@example.com", existingByEmail: null }),
    ).toEqual({ kind: "upsertByExternalId" });
  });

  it("upserts by external id when no email is present", () => {
    expect(
      resolveIdentity({ email: null, existingByEmail: null }),
    ).toEqual({ kind: "upsertByExternalId" });
  });

  it("does not anchor on a row when the email is missing, even if one is passed", () => {
    expect(
      resolveIdentity({ email: null, existingByEmail: { id: "u1" } }),
    ).toEqual({ kind: "upsertByExternalId" });
  });
});
