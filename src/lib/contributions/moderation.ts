import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Moderation operations for Community Safety + Super Admin (Phase 4, ADR-0014): the reports
// queue, report triage, proposal removal, and the audit trail. Every privileged action is
// recorded in `moderation_actions` (who/what/why); field-value diffs remain in
// `change_history` (see admin.ts) so reverts still work.

export type ModerationTargetType =
  | "market"
  | "proposal"
  | "submission"
  | "report"
  | "user"
  | "config";

export interface ModerationActionInput {
  actorId: string;
  action: string;
  targetType: ModerationTargetType;
  targetId?: string | null;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append a row to the audit trail. Accepts a transaction client so callers that mutate and
 * audit atomically (admin.ts overrides, role/ban changes) share one transaction.
 */
export async function recordModerationAction(
  input: ModerationActionInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  await client.moderationAction.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      reason: input.reason?.trim() || null,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}

export interface RawReportGroup {
  targetType: string;
  targetId: string;
  count: number;
  latestReportAt: Date;
}

/**
 * Pure: order queue groups by most open reports first, breaking ties by most-recent report.
 * Extracted so the queue's ranking is unit-testable without a database.
 */
export function orderQueueGroups(groups: RawReportGroup[]): RawReportGroup[] {
  return [...groups].sort(
    (a, b) =>
      b.count - a.count ||
      b.latestReportAt.getTime() - a.latestReportAt.getTime(),
  );
}

export interface QueueItem {
  targetType: "market" | "proposal" | "submission";
  targetId: string;
  openReports: number;
  latestReportAt: string;
  latestReason: string | null;
  /** Market slug for linking (the market itself, or the proposal's market). Null for submissions. */
  marketSlug: string | null;
  marketName: string | null;
  /** Proposal enrichment (null for market/submission targets). */
  proposalField: string | null;
  proposalStatus: string | null;
  /** Submission enrichment (null for market/proposal targets). */
  submissionName: string | null;
  submissionStatus: string | null;
}

/**
 * The moderation queue: open reports grouped by target, ranked by open-report count (then
 * recency), enriched with a market/proposal summary and the latest report reason. There is
 * intentionally **no auto-quarantine** (OQ-009 deferred) — this only surfaces counts.
 */
export async function getReportQueue(limit = 50, offset = 0): Promise<QueueItem[]> {
  const groups = await prisma.report.groupBy({
    by: ["targetType", "targetId"],
    where: { status: "open" },
    _count: { _all: true },
    _max: { createdAt: true },
  });

  const ranked = orderQueueGroups(
    groups.map((g) => ({
      targetType: g.targetType,
      targetId: g.targetId,
      count: g._count._all,
      latestReportAt: g._max.createdAt ?? new Date(0),
    })),
  ).slice(offset, offset + limit);

  const marketIds = ranked
    .filter((g) => g.targetType === "market")
    .map((g) => g.targetId);
  const proposalIds = ranked
    .filter((g) => g.targetType === "proposal")
    .map((g) => g.targetId);
  const submissionIds = ranked
    .filter((g) => g.targetType === "submission")
    .map((g) => g.targetId);

  const [markets, proposals, submissions] = await Promise.all([
    marketIds.length
      ? prisma.market.findMany({
          where: { id: { in: marketIds } },
          select: { id: true, slug: true, name: true },
        })
      : Promise.resolve([]),
    proposalIds.length
      ? prisma.proposal.findMany({
          where: { id: { in: proposalIds } },
          select: {
            id: true,
            field: true,
            status: true,
            market: { select: { slug: true, name: true } },
          },
        })
      : Promise.resolve([]),
    submissionIds.length
      ? prisma.marketSubmission.findMany({
          where: { id: { in: submissionIds } },
          select: { id: true, name: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const marketById = new Map(markets.map((m) => [m.id, m]));
  const proposalById = new Map(proposals.map((p) => [p.id, p]));
  const submissionById = new Map(submissions.map((s) => [s.id, s]));

  // Latest report reason per target, for a quick queue preview.
  const latestReasons = await prisma.report.findMany({
    where: {
      status: "open",
      OR: ranked.map((g) => ({
        targetType: g.targetType,
        targetId: g.targetId,
      })),
    },
    orderBy: { createdAt: "desc" },
    select: { targetType: true, targetId: true, reason: true, createdAt: true },
  });
  const reasonByTarget = new Map<string, string | null>();
  for (const r of latestReasons) {
    const key = `${r.targetType}:${r.targetId}`;
    if (!reasonByTarget.has(key)) reasonByTarget.set(key, r.reason);
  }

  return ranked.map((g) => {
    const market = g.targetType === "market" ? marketById.get(g.targetId) : undefined;
    const proposal =
      g.targetType === "proposal" ? proposalById.get(g.targetId) : undefined;
    const submission =
      g.targetType === "submission" ? submissionById.get(g.targetId) : undefined;
    return {
      targetType: g.targetType as "market" | "proposal" | "submission",
      targetId: g.targetId,
      openReports: g.count,
      latestReportAt: g.latestReportAt.toISOString(),
      latestReason: reasonByTarget.get(`${g.targetType}:${g.targetId}`) ?? null,
      marketSlug: market?.slug ?? proposal?.market.slug ?? null,
      marketName: market?.name ?? proposal?.market.name ?? null,
      proposalField: proposal?.field ?? null,
      proposalStatus: proposal?.status ?? null,
      submissionName: submission?.name ?? null,
      submissionStatus: submission?.status ?? null,
    };
  });
}

/**
 * Resolve or dismiss reports on a target and audit the decision. `resolve` marks reports
 * `actioned` (a moderator acted on the underlying content); `dismiss` marks them `dismissed`.
 * Returns the number of reports closed.
 */
export async function resolveReportsForTarget(
  actorId: string,
  targetType: "market" | "proposal" | "submission",
  targetId: string,
  decision: "resolve" | "dismiss",
  reason?: string | null,
): Promise<number> {
  const status = decision === "resolve" ? "actioned" : "dismissed";
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.report.updateMany({
      where: { targetType, targetId, status: "open" },
      data: { status },
    });
    await recordModerationAction(
      {
        actorId,
        action: decision === "resolve" ? "resolve_report" : "dismiss_report",
        targetType,
        targetId,
        reason,
        metadata: { closed: count },
      },
      tx,
    );
    return count;
  });
}

/**
 * Remove an abusive/incorrect proposal: mark it `rejected` so it drops out of the public
 * conflict view, and audit the removal. Does not un-promote an already-verified market value
 * (that is a Super-Admin revert). Returns false when the proposal does not exist.
 */
export async function removeProposal(
  actorId: string,
  proposalId: string,
  reason?: string | null,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findUnique({
      where: { id: proposalId },
      select: { id: true, status: true },
    });
    if (!proposal) return false;
    await tx.proposal.update({
      where: { id: proposalId },
      data: { status: "rejected" },
    });
    await recordModerationAction(
      {
        actorId,
        action: "remove_proposal",
        targetType: "proposal",
        targetId: proposalId,
        reason,
        metadata: { previousStatus: proposal.status },
      },
      tx,
    );
    return true;
  });
}

/**
 * Remove an abusive/incorrect submission for a **new** community market: mark it `hidden` so it
 * drops out of the public confirm queue, and audit the removal. Does not delete an already-promoted
 * market (that is a separate hide/override action). Returns false when the submission does not exist.
 */
export async function removeSubmission(
  actorId: string,
  submissionId: string,
  reason?: string | null,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const submission = await tx.marketSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true },
    });
    if (!submission) return false;
    await tx.marketSubmission.update({
      where: { id: submissionId },
      data: { status: "hidden" },
    });
    await recordModerationAction(
      {
        actorId,
        action: "remove_submission",
        targetType: "submission",
        targetId: submissionId,
        reason,
        metadata: { previousStatus: submission.status },
      },
      tx,
    );
    return true;
  });
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: string;
}

/** Read the moderation audit trail, newest first (paginated). */
export async function listModerationActions(
  limit = 100,
  offset = 0,
): Promise<AuditEntry[]> {
  const rows = await prisma.moderationAction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    select: {
      id: true,
      actorId: true,
      action: true,
      targetType: true,
      targetId: true,
      reason: true,
      metadata: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    actorId: r.actorId,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    metadata: r.metadata,
    createdAt: r.createdAt.toISOString(),
  }));
}
