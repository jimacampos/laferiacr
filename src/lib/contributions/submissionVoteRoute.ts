import { NextResponse } from "next/server";

import { requireWriter } from "./guards";
import { castSubmissionVote } from "./submissions";

/**
 * Shared handler for the submission confirm/reject routes (Phase 5). Account-gated: a valid,
 * non-banned session is required, the vote is one-per-user, and a submission's own author is
 * refused (403). On reaching the threshold `castSubmissionVote` promotes the submission into a
 * real market in a transaction.
 */
export async function handleSubmissionVote(
  submissionId: string,
  vote: "confirm" | "reject",
): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const gate = await requireWriter();
  if (!gate.ok) return gate.response;

  const result = await castSubmissionVote(submissionId, gate.userId, vote);

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
    marketSlug: result.marketSlug,
  });
}
