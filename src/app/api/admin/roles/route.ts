import { NextResponse } from "next/server";

import { requireCapability } from "@/lib/contributions/guards";
import { grantRole, revokeRole } from "@/lib/contributions/roleAdmin";
import { isRole } from "@/lib/contributions/rolesPolicy";

export const dynamic = "force-dynamic";

// Role management (Phase 4): a Super Admin grants or revokes a role for a user. Manual grant
// only (reputation-based Trusted is Phase 6). Refuses to remove the last Super Admin. Every
// change is audited; authorization resolves from the DB, never client claims.
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("manage_roles");
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { action, userId, role } = body as {
    action?: unknown;
    userId?: unknown;
    role?: unknown;
  };

  if (action !== "grant" && action !== "revoke") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  if (typeof userId !== "string" || userId.length === 0) {
    return NextResponse.json({ error: "invalid_user" }, { status: 400 });
  }
  if (typeof role !== "string" || !isRole(role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const result =
    action === "grant"
      ? await grantRole(gate.userId, userId, role)
      : await revokeRole(gate.userId, userId, role);

  if (!result.ok) {
    const status = result.error === "user_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ status: action, changed: result.changed });
}
