import { NextResponse } from "next/server";

import { requireCapability } from "@/lib/contributions/guards";
import { removeProposal } from "@/lib/contributions/moderation";

export const dynamic = "force-dynamic";

// Content removal (Phase 4): a moderator removes an abusive/incorrect proposal (marks it
// rejected so it drops out of the public conflict view). Audited in moderation_actions.
// Community Safety or higher; DB-resolved authorization only.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("remove_content");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  let reason: string | null = null;
  try {
    const body = (await request.json()) as { action?: unknown; reason?: unknown };
    if (body.action !== undefined && body.action !== "remove") {
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }
    if (typeof body.reason === "string") reason = body.reason;
  } catch {
    // Empty body is allowed — removal needs no payload.
  }

  const removed = await removeProposal(gate.userId, id, reason);
  if (!removed) {
    return NextResponse.json({ error: "proposal_not_found" }, { status: 404 });
  }
  return NextResponse.json({ status: "removed" });
}
