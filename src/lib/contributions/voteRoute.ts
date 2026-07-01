import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { castVote, type Vote } from "./voting";

/**
 * Shared handler for the confirm/reject routes. Account-gated (ADR-0007): a valid session
 * is required, the vote is one-per-user, and a proposal's own author is refused (403). On
 * reaching the threshold the underlying `castVote` promotes the proposal in a transaction.
 */
export async function handleVote(proposalId: string, vote: Vote): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const result = await castVote(proposalId, userId, vote);

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
