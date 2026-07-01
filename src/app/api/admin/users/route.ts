import { NextResponse } from "next/server";

import { requireCapability } from "@/lib/contributions/guards";
import { findUsers } from "@/lib/contributions/roleAdmin";

export const dynamic = "force-dynamic";

// User lookup for the role-management screen (Phase 4). Super Admin only. Searches accounts by
// email / display name / Entra oid so an operator can find who to grant a role or ban.
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("manage_roles");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? "";
  const users = await findUsers(query);
  return NextResponse.json({ users });
}
