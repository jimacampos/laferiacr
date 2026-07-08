import { NextResponse } from "next/server";

import { approveProposal } from "@/lib/contributions/admin";
import { requireCapability } from "@/lib/contributions/guards";
import { removeProposal } from "@/lib/contributions/moderation";

export const dynamic = "force-dynamic";

// Proposal actions for moderators/admins:
//   action='remove'  — Community Safety+ marks an abusive/incorrect proposal rejected so it
//                      drops out of the public conflict view (audited in moderation_actions).
//   action='approve' — Super Admin break-glass promotion from the attention queue: verify the
//                      proposal immediately (bypassing the N-confirmation threshold), write its
//                      value onto the market and supersede competitors. Audited as override_field.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const { id } = await params;

  let action: "remove" | "approve" = "remove";
  let reason: string | null = null;
  try {
    const body = (await request.json()) as { action?: unknown; reason?: unknown };
    if (body.action !== undefined) {
      if (body.action !== "remove" && body.action !== "approve") {
        return NextResponse.json({ error: "invalid_action" }, { status: 400 });
      }
      action = body.action;
    }
    if (typeof body.reason === "string") reason = body.reason;
  } catch {
    // Empty body is allowed — defaults to removal, which needs no payload.
  }

  if (action === "approve") {
    const gate = await requireCapability("override_field");
    if (!gate.ok) return gate.response;
    const approved = await approveProposal(gate.userId, id, reason);
    if (!approved) {
      return NextResponse.json({ error: "proposal_not_found" }, { status: 404 });
    }
    return NextResponse.json({ status: "approved" });
  }

  const gate = await requireCapability("remove_content");
  if (!gate.ok) return gate.response;
  const removed = await removeProposal(gate.userId, id, reason);
  if (!removed) {
    return NextResponse.json({ error: "proposal_not_found" }, { status: 404 });
  }
  return NextResponse.json({ status: "removed" });
}
