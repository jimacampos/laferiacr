import { prisma } from "@/lib/prisma";

import {
  type Capability,
  type Role,
  isAdmin,
  isModerator,
  rolesSatisfy,
} from "./rolesPolicy";

/**
 * All role strings granted to a user in `user_roles` (DB-backed, never client claims).
 * "member" is implicit for any signed-in account and is not stored, so a normal member
 * returns []; every gated capability requires an explicit Community-Safety+ grant.
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true },
  });
  return rows.map((row) => row.role);
}

/** True when the user holds a specific role grant. */
export async function hasRole(userId: string, role: Role): Promise<boolean> {
  const found = await prisma.userRole.findFirst({
    where: { userId, role },
    select: { id: true },
  });
  return found !== null;
}

/** DB-backed capability check: resolve the user's roles then apply the pure policy. */
export async function can(
  userId: string,
  capability: Capability,
): Promise<boolean> {
  return rolesSatisfy(await getUserRoles(userId), capability);
}

/** True when the user is Community Safety or higher (any moderation capability). */
export async function isModeratorUser(userId: string): Promise<boolean> {
  return isModerator(await getUserRoles(userId));
}

/**
 * True when the user holds the `super_admin` role. Kept for back-compat with the Phase 3
 * break-glass callsites (ADR-0013); Phase 4 layers the fuller capability model on top and
 * resolves everything from the DB (`user_roles`), never from client claims.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return isAdmin(await getUserRoles(userId));
}
