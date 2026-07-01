import { prisma } from "@/lib/prisma";

/**
 * True when the user holds the `super_admin` role (minimal RBAC pulled forward from
 * Phase 4 for break-glass admin — see ADR-0013, docs/architecture/rbac.md). Resolved from
 * the DB (`user_roles`), never from client claims.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await prisma.userRole.findFirst({
    where: { userId, role: "super_admin" },
    select: { id: true },
  });
  return role !== null;
}
