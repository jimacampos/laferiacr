import { handleVote } from "@/lib/contributions/voteRoute";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleVote(id, "confirm");
}
