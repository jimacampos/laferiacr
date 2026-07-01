import { prisma } from "@/lib/prisma";

import { recordModerationAction } from "./moderation";
import { type Role } from "./rolesPolicy";

// Role management for Super Admin (Phase 4, ADR-0014): look up users and grant/revoke roles,
// all audited. "member" is implicit (never stored), so only these roles are grantable. Manual
// grant only — reputation-based auto-Trusted is Phase 6 (BL-006 / OQ-002).
export const GRANTABLE_ROLES = ["trusted", "community_safety", "super_admin"] as const;
export type GrantableRole = (typeof GRANTABLE_ROLES)[number];

export function isGrantableRole(value: unknown): value is GrantableRole {
  return (
    typeof value === "string" &&
    (GRANTABLE_ROLES as readonly string[]).includes(value)
  );
}

export interface UserSummary {
  id: string;
  email: string | null;
  displayName: string | null;
  externalId: string;
  roles: string[];
}

export interface UserPage {
  users: UserSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export const USERS_PAGE_SIZE = 10;

/**
 * Paginated account listing for the role-management screen. An optional `query` filters by
 * email / display name / Entra oid; an empty query lists everyone (newest first).
 */
export async function listUsers(
  opts: { query?: string; page?: number; pageSize?: number } = {},
): Promise<UserPage> {
  const pageSize = Math.min(Math.max(opts.pageSize ?? USERS_PAGE_SIZE, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const q = (opts.query ?? "").trim();
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { displayName: { contains: q, mode: "insensitive" as const } },
          { externalId: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        displayName: true,
        externalId: true,
        roles: { select: { role: true } },
      },
    }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      externalId: u.externalId,
      roles: u.roles.map((r) => r.role),
    })),
    total,
    page,
    pageSize,
  };
}

/** Number of distinct accounts holding `super_admin` (guards against removing the last one). */
export async function countSuperAdmins(): Promise<number> {
  const rows = await prisma.userRole.findMany({
    where: { role: "super_admin" },
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.length;
}

export type RoleChangeResult =
  | { ok: true; changed: boolean }
  | {
      ok: false;
      error: "user_not_found" | "invalid_role" | "last_super_admin" | "not_granted";
    };

/** Grant a role to a user (scope-less/global). Idempotent; audited. */
export async function grantRole(
  actorId: string,
  userId: string,
  role: Role,
): Promise<RoleChangeResult> {
  if (!isGrantableRole(role)) return { ok: false, error: "invalid_role" };
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) return { ok: false, error: "user_not_found" } as const;

    // Compound unique includes scope; NULL scopes aren't deduped by it, so guard with findFirst.
    const existing = await tx.userRole.findFirst({
      where: { userId, role, scope: null },
      select: { id: true },
    });
    if (existing) return { ok: true, changed: false } as const;

    await tx.userRole.create({
      data: { userId, role, scope: null, grantedBy: actorId },
    });
    await recordModerationAction(
      {
        actorId,
        action: "grant_role",
        targetType: "user",
        targetId: userId,
        metadata: { role },
      },
      tx,
    );
    return { ok: true, changed: true } as const;
  });
}

/** Revoke a role from a user. Refuses to remove the last remaining Super Admin. Audited. */
export async function revokeRole(
  actorId: string,
  userId: string,
  role: Role,
): Promise<RoleChangeResult> {
  if (!isGrantableRole(role)) return { ok: false, error: "invalid_role" };
  return prisma.$transaction(async (tx) => {
    const existing = await tx.userRole.findFirst({
      where: { userId, role, scope: null },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "not_granted" } as const;

    if (role === "super_admin") {
      const admins = await tx.userRole.findMany({
        where: { role: "super_admin" },
        distinct: ["userId"],
        select: { userId: true },
      });
      if (admins.length <= 1) {
        return { ok: false, error: "last_super_admin" } as const;
      }
    }

    await tx.userRole.delete({ where: { id: existing.id } });
    await recordModerationAction(
      {
        actorId,
        action: "revoke_role",
        targetType: "user",
        targetId: userId,
        metadata: { role },
      },
      tx,
    );
    return { ok: true, changed: true } as const;
  });
}
