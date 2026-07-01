import { NextResponse } from "next/server";

import { requireCapability } from "@/lib/contributions/guards";
import { listModerationActions } from "@/lib/contributions/moderation";

export const dynamic = "force-dynamic";

// Moderation audit trail (Phase 4): the newest privileged actions (removals, hides, bans, role
// and config changes) from moderation_actions. Community Safety or higher; DB-resolved authz.
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("view_audit");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const limit = Math.min(
    Number.parseInt(url.searchParams.get("limit") ?? "100", 10) || 100,
    200,
  );
  const offset = Math.max(
    Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
    0,
  );

  const actions = await listModerationActions(limit, offset);
  return NextResponse.json({ actions });
}
