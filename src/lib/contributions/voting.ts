import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { confirmationThreshold } from "./config";
import { shouldPromote } from "./promotion";
import type { LocationValue } from "./validation";

export type Vote = "confirm" | "reject";

export type CastVoteResult =
  | {
      ok: true;
      promoted: boolean;
      status: string;
      confirmCount: number;
      rejectCount: number;
    }
  | { ok: false; error: "not_found" | "not_open" | "self_vote" };

interface ProposalRow {
  id: string;
  marketId: string;
  field: string;
  proposedValue: Prisma.JsonValue;
  submittedBy: string | null;
  status: string;
}

/** Reads the market's current value for `field`, shaped as it is stored on a proposal. */
async function currentMarketValue(
  tx: Prisma.TransactionClient,
  marketId: string,
  field: string,
): Promise<Prisma.InputJsonValue | null> {
  if (field === "hours") {
    const market = await tx.market.findUnique({
      where: { id: marketId },
      select: { hoursText: true },
    });
    return market?.hoursText ?? null;
  }
  const rows = await tx.$queryRaw<{ lat: number | null; lng: number | null }[]>`
    SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM markets WHERE id = ${marketId}::uuid LIMIT 1`;
  const row = rows[0];
  if (!row || row.lat === null || row.lng === null) return null;
  return { lat: row.lat, lng: row.lng };
}

/** Writes the promoted value onto the market row (hours column or PostGIS geography). */
async function writeMarketValue(
  tx: Prisma.TransactionClient,
  proposal: ProposalRow,
): Promise<void> {
  if (proposal.field === "hours") {
    await tx.market.update({
      where: { id: proposal.marketId },
      data: { hoursText: String(proposal.proposedValue) },
    });
    return;
  }
  const { lat, lng } = proposal.proposedValue as unknown as LocationValue;
  await tx.$executeRaw`
    UPDATE markets
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        updated_at = now()
    WHERE id = ${proposal.marketId}::uuid`;
}

/**
 * Cast an account-gated vote on a proposal and auto-promote when it reaches the threshold.
 * Runs in a single transaction: (1) record/replace the user's vote, (2) recount tallies,
 * (3) if net confirmations ≥ N, promote — write the market value, append change_history,
 * and supersede competing proposals for the same field. The proposal's own author may not
 * vote (integrity: promotion needs N confirmations from *other* accounts).
 */
export async function castVote(
  proposalId: string,
  userId: string,
  vote: Vote,
): Promise<CastVoteResult> {
  const threshold = confirmationThreshold();

  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        marketId: true,
        field: true,
        proposedValue: true,
        submittedBy: true,
        status: true,
      },
    });

    if (!proposal) return { ok: false, error: "not_found" } as const;
    if (proposal.status !== "pending") {
      return { ok: false, error: "not_open" } as const;
    }
    if (proposal.submittedBy && proposal.submittedBy === userId) {
      return { ok: false, error: "self_vote" } as const;
    }

    await tx.confirmation.upsert({
      where: { proposalId_userId: { proposalId, userId } },
      update: { vote },
      create: { proposalId, userId, vote },
    });

    const [confirmCount, rejectCount] = await Promise.all([
      tx.confirmation.count({ where: { proposalId, vote: "confirm" } }),
      tx.confirmation.count({ where: { proposalId, vote: "reject" } }),
    ]);

    const promoted = shouldPromote({ confirmCount, rejectCount }, threshold);
    const status = promoted ? "verified" : "pending";

    await tx.proposal.update({
      where: { id: proposalId },
      data: { confirmCount, rejectCount, status },
    });

    if (promoted) {
      const oldValue = await currentMarketValue(tx, proposal.marketId, proposal.field);
      await writeMarketValue(tx, proposal);
      await tx.changeHistory.create({
        data: {
          marketId: proposal.marketId,
          field: proposal.field,
          oldValue: oldValue ?? Prisma.JsonNull,
          newValue: proposal.proposedValue as Prisma.InputJsonValue,
          causedByProposal: proposal.id,
          action: "promote",
        },
      });
      await tx.proposal.updateMany({
        where: {
          marketId: proposal.marketId,
          field: proposal.field,
          id: { not: proposal.id },
          status: { in: ["pending", "verified"] },
        },
        data: { status: "superseded" },
      });
    }

    return { ok: true, promoted, status, confirmCount, rejectCount };
  });
}
