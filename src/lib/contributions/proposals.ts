import { prisma } from "@/lib/prisma";

import { confirmationThreshold, type ProposalField } from "./config";
import { remainingConfirmations } from "./promotion";
import type {
  FieldContributionState,
  LocationValue,
  MarketContributions,
} from "./types";

export type {
  FieldContributionState,
  MarketContributions,
  PendingProposal,
} from "./types";

const EMPTY_FIELD: FieldContributionState = {
  verified: false,
  verifiedAt: null,
  verifiedConfirmCount: null,
  pending: [],
};

export const EMPTY_CONTRIBUTIONS: MarketContributions = {
  hours: EMPTY_FIELD,
  location: EMPTY_FIELD,
};

/** Resolve a market's internal uuid from its public slug (write routes key on slug). */
export async function getMarketIdBySlug(slug: string): Promise<string | null> {
  const market = await prisma.market.findUnique({
    where: { slug },
    select: { id: true },
  });
  return market?.id ?? null;
}

interface RawProposal {
  id: string;
  field: string;
  status: string;
  proposedValue: unknown;
  submittedBy: string | null;
  confirmCount: number;
  rejectCount: number;
  createdAt: Date;
  updatedAt: Date;
}

function buildFieldState(
  proposals: RawProposal[],
  field: ProposalField,
  threshold: number,
  viewerId: string | undefined,
  viewerVotes: Map<string, "confirm" | "reject">,
): FieldContributionState {
  const forField = proposals.filter((p) => p.field === field);
  const verified = forField.find((p) => p.status === "verified") ?? null;
  const pending = forField
    .filter((p) => p.status === "pending")
    .map((p) => {
      const net = p.confirmCount - p.rejectCount;
      return {
        id: p.id,
        value: p.proposedValue as string | LocationValue,
        confirmCount: p.confirmCount,
        rejectCount: p.rejectCount,
        net,
        remaining: remainingConfirmations(
          { confirmCount: p.confirmCount, rejectCount: p.rejectCount },
          threshold,
        ),
        createdAt: p.createdAt.toISOString(),
        own: viewerId !== undefined && p.submittedBy === viewerId,
        viewerVote: viewerVotes.get(p.id) ?? null,
      };
    })
    .sort((a, b) => b.net - a.net || a.createdAt.localeCompare(b.createdAt));

  return {
    verified: verified !== null,
    verifiedAt: verified?.updatedAt.toISOString() ?? null,
    verifiedConfirmCount: verified?.confirmCount ?? null,
    pending,
  };
}

/**
 * Per-field contribution/trust state for a market's detail page: whether hours/location are
 * community-verified (with confirmation count + last-updated) and any pending alternatives
 * awaiting confirmation. When `viewerId` is given, pending proposals are tagged with whether
 * the viewer authored them and how they already voted. Returns empty state on error so the
 * page still renders.
 */
export async function getMarketContributions(
  marketId: string,
  viewerId?: string,
): Promise<MarketContributions> {
  const threshold = confirmationThreshold();
  try {
    const proposals = await prisma.proposal.findMany({
      where: { marketId, status: { in: ["pending", "verified"] } },
      select: {
        id: true,
        field: true,
        status: true,
        proposedValue: true,
        submittedBy: true,
        confirmCount: true,
        rejectCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const viewerVotes = new Map<string, "confirm" | "reject">();
    if (viewerId) {
      const pendingIds = proposals
        .filter((p) => p.status === "pending")
        .map((p) => p.id);
      if (pendingIds.length > 0) {
        const votes = await prisma.confirmation.findMany({
          where: { userId: viewerId, proposalId: { in: pendingIds } },
          select: { proposalId: true, vote: true },
        });
        for (const v of votes) {
          viewerVotes.set(v.proposalId, v.vote as "confirm" | "reject");
        }
      }
    }

    return {
      hours: buildFieldState(proposals, "hours", threshold, viewerId, viewerVotes),
      location: buildFieldState(proposals, "location", threshold, viewerId, viewerVotes),
    };
  } catch {
    return EMPTY_CONTRIBUTIONS;
  }
}
