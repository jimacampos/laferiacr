import { NextResponse } from "next/server";

import { requireCapability } from "@/lib/contributions/guards";
import { removeSubmission } from "@/lib/contributions/moderation";

export const dynamic = "force-dynamic";

// Submission actions for moderators (Phase 5):
//   action='remove' — Community Safety+ marks an abusive/incorrect new-market submission hidden so
//                     it drops out of the public confirm queue (audited in moderation_actions).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const { id } = await params;

  let reason: string | null = null;
  try {
    const body = (await request.json()) as { action?: unknown; reason?: unknown };
    if (body.action !== undefined && body.action !== "remove") {
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }
    if (typeof body.reason === "string") reason = body.reason;
  } catch {
    // Empty body is allowed — defaults to removal, which needs no payload.
  }

  const gate = await requireCapability("remove_content");
  if (!gate.ok) return gate.response;

  const removed = await removeSubmission(gate.userId, id, reason);
  if (!removed) {
    return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
  }
  return NextResponse.json({ status: "removed" });
}
