import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { activeBan } from "./bans";
import { can } from "./roles";
import type { Capability } from "./rolesPolicy";

// Shared server-side route guards (Phase 4). Every mutating route resolves identity and
// authorization from the DB, never from client claims. Content-write paths additionally
// enforce temp-bans; governance (moderation/admin) paths are capability-gated but not
// ban-gated, to avoid a moderator locking themselves out.

export type Guard =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

function deny(status: number, error: string): Guard {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/** Require a signed-in session. Returns the internal user id or a 401 response. */
export async function requireUser(): Promise<Guard> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return deny(401, "auth_required");
  return { ok: true, userId };
}

/**
 * Require a signed-in, **non-banned** user for a content-write path (confirm/reject, and
 * account-attributed proposals/reports). Returns 401 when signed out, 403 `banned` when an
 * active ban is in force.
 */
export async function requireWriter(): Promise<Guard> {
  const gate = await requireUser();
  if (!gate.ok) return gate;
  if (await activeBan(gate.userId)) return deny(403, "banned");
  return gate;
}

/**
 * Require a signed-in user who holds `capability` (moderation/admin path). Resolved from
 * `user_roles` via the pure policy; no ban gate so governance isn't self-lockable.
 */
export async function requireCapability(capability: Capability): Promise<Guard> {
  const gate = await requireUser();
  if (!gate.ok) return gate;
  if (!(await can(gate.userId, capability))) return deny(403, "forbidden");
  return gate;
}
