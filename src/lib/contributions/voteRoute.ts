import { NextResponse } from "next/server";

import { requireWriter } from "./guards";
import { castVote, type Vote } from "./voting";

/**
 * Shared handler for the confirm/reject routes. Account-gated (ADR-0007): a valid session
 * is required, active-banned users are refused (Phase 4), the vote is one-per-user, and a
 * proposal's own author is refused (403). On reaching the threshold the underlying `castVote`
 * promotes the proposal in a transaction.
 */
export async function handleVote(proposalId: string, vote: Vote): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const gate = await requireWriter();
  if (!gate.ok) return gate.response;

  const result = await castVote(proposalId, gate.userId, vote);

  if (!result.ok) {
    const statusByError = {
      not_found: 404,
      not_open: 409,
      self_vote: 403,
    } as const;
    return NextResponse.json(
      { error: result.error },
      { status: statusByError[result.error] },
    );
  }

  return NextResponse.json({
    status: result.status,
    promoted: result.promoted,
    confirmCount: result.confirmCount,
    rejectCount: result.rejectCount,
  });
}
