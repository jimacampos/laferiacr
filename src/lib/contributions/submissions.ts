import { randomUUID } from "node:crypto";

import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  rankDuplicates,
  nameSimilarity,
  type DuplicateCandidate,
} from "./duplicates";
import { remainingConfirmations, shouldPromote } from "./promotion";
import { resolveConfirmationThreshold } from "./settings";
import { slugify, uniqueSlug } from "./slug";
import type { LocationValue, ValidatedSubmission } from "./validation";
import type { SubmissionDetails, PendingSubmission } from "./submissionTypes";

export type { SubmissionDetails, PendingSubmission } from "./submissionTypes";

// DB-backed operations for community-submitted new markets (Phase 5, ADR-0009). Submitting
// requires sign-in; a submission collects account-gated confirmations and is auto-promoted into
// a real `markets` row (`source='community'`) at N net confirmations — mirroring the Phase 3
// proposal loop (see voting.ts). The PostGIS `location` column is written/read via raw SQL.

function detailsOf(value: Prisma.JsonValue): SubmissionDetails {
  const d = (value ?? {}) as Partial<SubmissionDetails>;
  return {
    regionId: d.regionId ?? "",
    regionName: d.regionName ?? "",
    days: Array.isArray(d.days) ? d.days : [],
    daysLabel: d.daysLabel ?? "",
    hoursText: d.hoursText ?? null,
    referenceText: d.referenceText ?? null,
    mapUrl: d.mapUrl ?? null,
    organizer: d.organizer ?? null,
    phones: Array.isArray(d.phones) ? d.phones : [],
  };
}

/**
 * Create a pending new-market submission. `location` (when present) is written to the PostGIS
 * column via raw SQL after the row is created (Prisma cannot set a `geography` value).
 */
export async function createSubmission(
  value: ValidatedSubmission,
  submittedBy: string,
  ipHash: string | null,
): Promise<{ id: string }> {
  const details: SubmissionDetails = {
    regionId: value.regionId,
    regionName: value.regionName,
    days: value.days,
    daysLabel: value.daysLabel,
    hoursText: value.hoursText,
    referenceText: value.referenceText,
    mapUrl: value.mapUrl,
    organizer: value.organizer,
    phones: value.phones,
  };

  const submission = await prisma.marketSubmission.create({
    data: {
      name: value.name,
      details: details as unknown as Prisma.InputJsonValue,
      submittedBy,
      submitterIpHash: ipHash,
    },
    select: { id: true },
  });

  if (value.location) {
    const { lat, lng } = value.location;
    await prisma.$executeRaw`
      UPDATE market_submissions
      SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${submission.id}::uuid`;
  }

  return { id: submission.id };
}

interface DuplicateRow {
  slug: string;
  name: string;
  region_name: string;
  distance: number | null;
}

/**
 * Find likely duplicates of a proposed market among active markets: name similarity (computed
 * in-process) plus PostGIS proximity when a pin is supplied. Soft-warning only — the caller
 * shows these but never blocks (ADR-0009).
 */
export async function findDuplicateCandidates(
  name: string,
  location: LocationValue | null,
): Promise<DuplicateCandidate[]> {
  const rows = location
    ? await prisma.$queryRaw<DuplicateRow[]>`
        SELECT slug, name, region_name,
          CASE WHEN location IS NOT NULL
            THEN ST_Distance(
              location,
              ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography)
            ELSE NULL END AS distance
        FROM markets WHERE status = 'active'`
    : await prisma.$queryRaw<DuplicateRow[]>`
        SELECT slug, name, region_name, NULL::float8 AS distance
        FROM markets WHERE status = 'active'`;

  const candidates: DuplicateCandidate[] = rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    regionName: row.region_name,
    nameScore: nameSimilarity(name, row.name),
    distanceMeters: row.distance === null ? null : Math.round(row.distance),
  }));

  return rankDuplicates(candidates).slice(0, 5);
}

interface SubmissionRow {
  id: string;
  name: string;
  details: Prisma.JsonValue;
  status: string;
  submittedBy: string;
  confirmCount: number;
  rejectCount: number;
  createdAt: Date;
}

async function shapeSubmissions(
  rows: SubmissionRow[],
  threshold: number,
  viewerId: string | undefined,
): Promise<PendingSubmission[]> {
  const ids = rows.map((r) => r.id);

  // Which of these submissions have coordinates (location is an Unsupported column).
  const located = ids.length
    ? await prisma.$queryRaw<{ id: string; lat: number; lng: number }[]>`
        SELECT id::text AS id,
          ST_Y(location::geometry) AS lat,
          ST_X(location::geometry) AS lng
        FROM market_submissions
        WHERE id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})
          AND location IS NOT NULL`
    : [];
  const locationById = new Map(located.map((l) => [l.id, { lat: l.lat, lng: l.lng }]));

  // The viewer's own votes on these submissions, if signed in.
  const votes =
    viewerId && ids.length
      ? await prisma.submissionConfirmation.findMany({
          where: { submissionId: { in: ids }, userId: viewerId },
          select: { submissionId: true, vote: true },
        })
      : [];
  const voteBySubmission = new Map(votes.map((v) => [v.submissionId, v.vote]));

  return rows.map((row) => {
    const details = detailsOf(row.details);
    const net = row.confirmCount - row.rejectCount;
    const location = locationById.get(row.id) ?? null;
    return {
      id: row.id,
      name: row.name,
      regionName: details.regionName,
      days: details.days,
      daysLabel: details.daysLabel,
      hoursText: details.hoursText,
      referenceText: details.referenceText,
      mapUrl: details.mapUrl,
      organizer: details.organizer,
      phones: details.phones,
      hasLocation: location !== null,
      location,
      status: row.status,
      confirmCount: row.confirmCount,
      rejectCount: row.rejectCount,
      net,
      remaining: remainingConfirmations(
        { confirmCount: row.confirmCount, rejectCount: row.rejectCount },
        threshold,
      ),
      createdAt: row.createdAt.toISOString(),
      own: viewerId !== undefined && row.submittedBy === viewerId,
      viewerVote: (voteBySubmission.get(row.id) as "confirm" | "reject") ?? null,
    };
  });
}

export interface PendingSubmissionsPage {
  items: PendingSubmission[];
  total: number;
}

/** Paginated list of pending submissions, newest first, for the public confirm queue. */
export async function listPendingSubmissions(
  page: number,
  pageSize: number,
  viewerId?: string,
): Promise<PendingSubmissionsPage> {
  const threshold = await resolveConfirmationThreshold();
  const where = { status: "pending" as const };
  const [total, rows] = await Promise.all([
    prisma.marketSubmission.count({ where }),
    prisma.marketSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: Math.max(page - 1, 0) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        details: true,
        status: true,
        submittedBy: true,
        confirmCount: true,
        rejectCount: true,
        createdAt: true,
      },
    }),
  ]);
  const items = await shapeSubmissions(rows, threshold, viewerId);
  return { items, total };
}

/** A single submission by id (any status), shaped for a detail view. */
export async function getSubmission(
  id: string,
  viewerId?: string,
): Promise<PendingSubmission | null> {
  const threshold = await resolveConfirmationThreshold();
  const row = await prisma.marketSubmission.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      details: true,
      status: true,
      submittedBy: true,
      confirmCount: true,
      rejectCount: true,
      createdAt: true,
    },
  });
  if (!row) return null;
  const [shaped] = await shapeSubmissions([row], threshold, viewerId);
  return shaped ?? null;
}

export type CastSubmissionVoteResult =
  | {
      ok: true;
      promoted: boolean;
      status: string;
      confirmCount: number;
      rejectCount: number;
      /** Slug of the market created on promotion, if any. */
      marketSlug: string | null;
    }
  | { ok: false; error: "not_found" | "not_open" | "self_vote" };

/**
 * Promote a verified submission into a real market: generate a unique slug, insert the
 * `markets` row (`source='community'`, `status='active'`), copy the location, and link it back.
 * Runs inside the vote transaction.
 */
async function promoteSubmission(
  tx: Prisma.TransactionClient,
  submissionId: string,
): Promise<{ slug: string; marketId: string }> {
  const submission = await tx.marketSubmission.findUniqueOrThrow({
    where: { id: submissionId },
    select: { name: true, details: true },
  });
  const details = detailsOf(submission.details);

  const existing = await tx.market.findMany({ select: { slug: true } });
  const taken = new Set(existing.map((m) => m.slug));
  const slug = uniqueSlug(slugify(submission.name), taken);

  const marketId = randomUUID();
  await tx.market.create({
    data: {
      id: marketId,
      slug,
      name: submission.name,
      regionId: details.regionId,
      regionName: details.regionName,
      days: details.days as unknown as Prisma.InputJsonValue,
      daysLabel: details.daysLabel,
      hoursText: details.hoursText,
      referenceText: details.referenceText,
      mapUrl: details.mapUrl,
      organizer: details.organizer,
      phones: details.phones,
      source: "community",
      status: "active",
    },
  });

  const loc = await tx.$queryRaw<{ lat: number | null; lng: number | null }[]>`
    SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM market_submissions WHERE id = ${submissionId}::uuid LIMIT 1`;
  const point = loc[0];
  if (point && point.lat !== null && point.lng !== null) {
    await tx.$executeRaw`
      UPDATE markets
      SET location = ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)::geography,
          updated_at = now()
      WHERE id = ${marketId}::uuid`;
  }

  return { slug, marketId };
}

/**
 * Cast an account-gated vote on a submission and auto-promote when it reaches the threshold.
 * Mirrors `castVote` for proposals: one vote per user, the author cannot vote on their own
 * submission, and promotion creates the market in the same transaction.
 */
export async function castSubmissionVote(
  submissionId: string,
  userId: string,
  vote: "confirm" | "reject",
): Promise<CastSubmissionVoteResult> {
  const threshold = await resolveConfirmationThreshold();

  return prisma.$transaction(async (tx) => {
    const submission = await tx.marketSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, submittedBy: true, status: true },
    });

    if (!submission) return { ok: false, error: "not_found" } as const;
    if (submission.status !== "pending") {
      return { ok: false, error: "not_open" } as const;
    }
    if (submission.submittedBy === userId) {
      return { ok: false, error: "self_vote" } as const;
    }

    await tx.submissionConfirmation.upsert({
      where: { submissionId_userId: { submissionId, userId } },
      update: { vote },
      create: { submissionId, userId, vote },
    });

    const [confirmCount, rejectCount] = await Promise.all([
      tx.submissionConfirmation.count({ where: { submissionId, vote: "confirm" } }),
      tx.submissionConfirmation.count({ where: { submissionId, vote: "reject" } }),
    ]);

    const promoted = shouldPromote({ confirmCount, rejectCount }, threshold);
    const status = promoted ? "verified" : "pending";

    let marketSlug: string | null = null;
    let promotedMarketId: string | null = null;
    if (promoted) {
      const result = await promoteSubmission(tx, submissionId);
      marketSlug = result.slug;
      promotedMarketId = result.marketId;
    }

    await tx.marketSubmission.update({
      where: { id: submissionId },
      data: {
        confirmCount,
        rejectCount,
        status,
        ...(promotedMarketId ? { promotedMarketId } : {}),
      },
    });

    return { ok: true, promoted, status, confirmCount, rejectCount, marketSlug };
  });
}
