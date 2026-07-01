import { auth } from "@/auth";

import { getUserRoles } from "./roles";
import { isAdmin, isModerator, rolesSatisfy, type Capability } from "./rolesPolicy";

// Server-only helper that resolves the current viewer's moderation access from the DB, for
// gating server components (the /admin area, inline market controls) and the Header link.
// Enforcement of individual mutating routes still goes through the guards in guards.ts.

export interface ViewerAccess {
  userId: string | null;
  roles: string[];
  isModerator: boolean;
  isSuperAdmin: boolean;
}

const ANONYMOUS: ViewerAccess = {
  userId: null,
  roles: [],
  isModerator: false,
  isSuperAdmin: false,
};

/** Resolve the signed-in viewer's roles + coarse moderation flags (anonymous when signed out). */
export async function getViewerAccess(): Promise<ViewerAccess> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (!userId) return ANONYMOUS;

  const roles = await getUserRoles(userId);
  return {
    userId,
    roles,
    isModerator: isModerator(roles),
    isSuperAdmin: isAdmin(roles),
  };
}

/** Whether a resolved viewer holds a capability (pure check over already-loaded roles). */
export function viewerCan(access: ViewerAccess, capability: Capability): boolean {
  return rolesSatisfy(access.roles, capability);
}
