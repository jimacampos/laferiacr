// Pure, dependency-free RBAC policy for Phase 4 (see docs/architecture/rbac.md, ADR-0014).
// Roles are additive by rank; capabilities map to a minimum role. Keep this module free of
// prisma/server imports so it is unit-testable and safe to import from client components.

/** The four roles, lowest to highest privilege. */
export const ROLES = ["member", "trusted", "community_safety", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

// Additive rank: a higher role includes every lower role's capabilities.
const ROLE_RANK: Record<Role, number> = {
  member: 0,
  trusted: 1,
  community_safety: 2,
  super_admin: 3,
};

/** Discrete capabilities gated across the moderation/admin surface. */
export const CAPABILITIES = [
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
] as const;
export type Capability = (typeof CAPABILITIES)[number];

// Minimum role that unlocks each capability, mirroring the rbac.md matrix. Community Safety
// handles abuse remediation (queue, removal, hide, ban, revert, audit); structural powers
// (direct field override, role management, policy/N) are Super-Admin only.
const CAPABILITY_MIN_ROLE: Record<Capability, Role> = {
  view_queue: "community_safety",
  resolve_reports: "community_safety",
  remove_content: "community_safety",
  hide_market: "community_safety",
  ban_user: "community_safety",
  revert: "community_safety",
  view_audit: "community_safety",
  override_field: "super_admin",
  manage_roles: "super_admin",
  configure_policy: "super_admin",
};

/** True when `value` is one of the known role strings. */
export function isRole(value: string): value is Role {
  return value in ROLE_RANK;
}

/** Highest rank among a set of held role strings; -1 when none are recognized. */
export function maxRoleRank(roles: readonly string[]): number {
  let rank = -1;
  for (const role of roles) {
    if (isRole(role)) rank = Math.max(rank, ROLE_RANK[role]);
  }
  return rank;
}

/** Pure capability check: do the held roles meet the capability's minimum role (additive)? */
export function rolesSatisfy(
  roles: readonly string[],
  capability: Capability,
): boolean {
  return maxRoleRank(roles) >= ROLE_RANK[CAPABILITY_MIN_ROLE[capability]];
}

/** Convenience: any moderation/admin capability at all (i.e. Community Safety or higher). */
export function isModerator(roles: readonly string[]): boolean {
  return rolesSatisfy(roles, "view_queue");
}

/** Convenience: Super Admin (structural powers). */
export function isAdmin(roles: readonly string[]): boolean {
  return rolesSatisfy(roles, "manage_roles");
}
