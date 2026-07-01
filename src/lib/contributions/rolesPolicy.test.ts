import { describe, expect, it } from "vitest";

import {
  isAdmin,
  isModerator,
  isRole,
  maxRoleRank,
  rolesSatisfy,
} from "./rolesPolicy";

// The pure RBAC policy is the trust-critical core of Phase 4 (ADR-0014): roles are additive by
// rank and each capability maps to a minimum role. These pin the capability matrix so a
// regression can't silently widen (or lock out) a role. Server enforcement (roles.ts/guards.ts)
// resolves the held roles from the DB and defers the decision to these helpers.

describe("isRole", () => {
  it("recognizes the four known roles", () => {
    expect(isRole("member")).toBe(true);
    expect(isRole("trusted")).toBe(true);
    expect(isRole("community_safety")).toBe(true);
    expect(isRole("super_admin")).toBe(true);
  });

  it("rejects unknown strings", () => {
    expect(isRole("admin")).toBe(false);
    expect(isRole("")).toBe(false);
  });
});

describe("maxRoleRank", () => {
  it("is -1 when no recognized role is held (implicit member)", () => {
    expect(maxRoleRank([])).toBe(-1);
    expect(maxRoleRank(["nonsense"])).toBe(-1);
  });

  it("returns the highest rank among held roles", () => {
    expect(maxRoleRank(["trusted"])).toBe(1);
    expect(maxRoleRank(["trusted", "super_admin", "community_safety"])).toBe(3);
  });
});

describe("rolesSatisfy (additive capability matrix)", () => {
  it("gives a plain member (no roles) no gated capability", () => {
    expect(rolesSatisfy([], "view_queue")).toBe(false);
    expect(rolesSatisfy([], "ban_user")).toBe(false);
    expect(rolesSatisfy([], "manage_roles")).toBe(false);
  });

  it("gives Trusted no moderation powers (it is a marker only)", () => {
    expect(rolesSatisfy(["trusted"], "view_queue")).toBe(false);
    expect(rolesSatisfy(["trusted"], "remove_content")).toBe(false);
  });

  it("gives Community Safety the abuse-remediation capabilities", () => {
    const cs = ["community_safety"];
    for (const cap of [
      "view_queue",
      "resolve_reports",
      "remove_content",
      "hide_market",
      "ban_user",
      "revert",
      "view_audit",
    ] as const) {
      expect(rolesSatisfy(cs, cap)).toBe(true);
    }
  });

  it("withholds structural powers from Community Safety", () => {
    const cs = ["community_safety"];
    expect(rolesSatisfy(cs, "override_field")).toBe(false);
    expect(rolesSatisfy(cs, "manage_roles")).toBe(false);
    expect(rolesSatisfy(cs, "configure_policy")).toBe(false);
  });

  it("gives Super Admin every capability (additive)", () => {
    const sa = ["super_admin"];
    for (const cap of [
      "view_queue",
      "resolve_reports",
      "remove_content",
      "hide_market",
      "ban_user",
      "revert",
      "view_audit",
      "override_field",
      "manage_roles",
      "configure_policy",
    ] as const) {
      expect(rolesSatisfy(sa, cap)).toBe(true);
    }
  });
});

describe("isModerator / isAdmin", () => {
  it("treats Community Safety and above as moderators", () => {
    expect(isModerator([])).toBe(false);
    expect(isModerator(["trusted"])).toBe(false);
    expect(isModerator(["community_safety"])).toBe(true);
    expect(isModerator(["super_admin"])).toBe(true);
  });

  it("treats only Super Admin as admin", () => {
    expect(isAdmin(["community_safety"])).toBe(false);
    expect(isAdmin(["super_admin"])).toBe(true);
  });
});
