import { NextResponse } from "next/server";

import { requireCapability } from "@/lib/contributions/guards";
import { listUsers } from "@/lib/contributions/roleAdmin";

export const dynamic = "force-dynamic";

// User listing for the role-management screen (Phase 4). Super Admin only. Returns a paginated
// list of accounts (newest first) so an operator can browse everyone or filter by email / display
// name / Entra oid to find who to grant a role or ban.
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("manage_roles");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? "";
  const pageParam = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const result = await listUsers({ query, page });
  return NextResponse.json(result);
}
