import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { recordModerationAction } from "./moderation";
import type { LocationValue } from "./validation";

export type AdminField = "hours" | "location" | "status";

/** Reads a market field in the JSON shape used by change_history/proposals. */
async function readFieldValue(
  tx: Prisma.TransactionClient,
  marketId: string,
  field: AdminField,
): Promise<Prisma.InputJsonValue | null> {
  if (field === "status") {
    const m = await tx.market.findUnique({
      where: { id: marketId },
      select: { status: true },
    });
    return m?.status ?? null;
  }
  if (field === "hours") {
    const m = await tx.market.findUnique({
      where: { id: marketId },
      select: { hoursText: true },
    });
    return m?.hoursText ?? null;
  }
  const rows = await tx.$queryRaw<{ lat: number | null; lng: number | null }[]>`
    SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM markets WHERE id = ${marketId}::uuid LIMIT 1`;
  const row = rows[0];
  if (!row || row.lat === null || row.lng === null) return null;
  return { lat: row.lat, lng: row.lng };
}

/** Writes a market field value (handles the PostGIS geography and null clears). */
async function writeFieldValue(
  tx: Prisma.TransactionClient,
  marketId: string,
  field: AdminField,
  value: Prisma.JsonValue | null,
): Promise<void> {
  if (field === "status") {
    await tx.market.update({
      where: { id: marketId },
      data: { status: String(value ?? "active") },
    });
    return;
  }
  if (field === "hours") {
    await tx.market.update({
      where: { id: marketId },
      data: { hoursText: value === null ? null : String(value) },
    });
    return;
  }
  if (value === null) {
    await tx.$executeRaw`
      UPDATE markets SET location = NULL, updated_at = now() WHERE id = ${marketId}::uuid`;
    return;
  }
  const { lat, lng } = value as unknown as LocationValue;
  await tx.$executeRaw`
    UPDATE markets
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        updated_at = now()
    WHERE id = ${marketId}::uuid`;
}

/**
 * Break-glass override of a market field by a super_admin. Writes the value, records a
 * change_history entry (action='override', actor), and supersedes competing proposals so
 * the manual value stands. Minimal governance ahead of Phase 4 (ADR-0013).
 */
export async function overrideField(
  actorId: string,
  marketId: string,
  field: "hours" | "location",
  newValue: string | LocationValue,
  reason?: string | null,
): Promise<void> {
  const value = newValue as unknown as Prisma.InputJsonValue;
  await prisma.$transaction(async (tx) => {
    const oldValue = await readFieldValue(tx, marketId, field);
    await writeFieldValue(tx, marketId, field, value as Prisma.JsonValue);
    await tx.changeHistory.create({
      data: {
        marketId,
        field,
        oldValue: oldValue ?? Prisma.JsonNull,
        newValue: value,
        actorId,
        action: "override",
      },
    });
    await tx.proposal.updateMany({
      where: { marketId, field, status: { in: ["pending", "verified"] } },
      data: { status: "superseded" },
    });
    await recordModerationAction(
      {
        actorId,
        action: "override_field",
        targetType: "market",
        targetId: marketId,
        reason,
        metadata: { field },
      },
      tx,
    );
  });
}

/**
 * Break-glass approval of a single pending proposal by a super_admin, from the attention queue.
 * Promotes it immediately (bypassing the N-confirmation threshold): writes the proposal's value
 * onto the market, marks the proposal `verified`, supersedes competing proposals for the same
 * field, records a change_history entry (action='override', linked via causedByProposal for
 * provenance) and a moderation audit entry (targetType='proposal'). Returns false when the
 * proposal doesn't exist or is no longer pending.
 */
export async function approveProposal(
  actorId: string,
  proposalId: string,
  reason?: string | null,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        marketId: true,
        field: true,
        proposedValue: true,
        status: true,
      },
    });
    if (!proposal || proposal.status !== "pending") return false;
    if (proposal.field !== "hours" && proposal.field !== "location") return false;

    const field = proposal.field;
    const value = proposal.proposedValue as Prisma.InputJsonValue;

    const oldValue = await readFieldValue(tx, proposal.marketId, field);
    await writeFieldValue(tx, proposal.marketId, field, value as Prisma.JsonValue);

    await tx.proposal.update({
      where: { id: proposal.id },
      data: { status: "verified" },
    });
    await tx.changeHistory.create({
      data: {
        marketId: proposal.marketId,
        field,
        oldValue: oldValue ?? Prisma.JsonNull,
        newValue: value,
        actorId,
        causedByProposal: proposal.id,
        action: "override",
      },
    });
    await tx.proposal.updateMany({
      where: {
        marketId: proposal.marketId,
        field,
        id: { not: proposal.id },
        status: { in: ["pending", "verified"] },
      },
      data: { status: "superseded" },
    });
    await recordModerationAction(
      {
        actorId,
        action: "override_field",
        targetType: "proposal",
        targetId: proposal.id,
        reason,
        metadata: { field, marketId: proposal.marketId },
      },
      tx,
    );
    return true;
  });
}

/**
 * Revert a market field to the value it held before the most recent change, using the
 * latest change_history entry's `old_value`. Records the revert itself (action='revert').
 * Returns false when there is no history to revert.
 */
export async function revertField(
  actorId: string,
  marketId: string,
  field: "hours" | "location",
  reason?: string | null,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const last = await tx.changeHistory.findFirst({
      where: { marketId, field },
      orderBy: { createdAt: "desc" },
      select: { oldValue: true },
    });
    if (!last) return false;

    const current = await readFieldValue(tx, marketId, field);
    const restored = last.oldValue;
    await writeFieldValue(tx, marketId, field, restored ?? null);
    await tx.changeHistory.create({
      data: {
        marketId,
        field,
        oldValue: current ?? Prisma.JsonNull,
        newValue:
          restored === null || restored === undefined
            ? Prisma.JsonNull
            : (restored as Prisma.InputJsonValue),
        actorId,
        action: "revert",
      },
    });
    await recordModerationAction(
      {
        actorId,
        action: "revert_field",
        targetType: "market",
        targetId: marketId,
        reason,
        metadata: { field },
      },
      tx,
    );
    return true;
  });
}

/** Hide (or unhide) a market. Records the status change (action='hide') + moderation audit. */
export async function setMarketHidden(
  actorId: string,
  marketId: string,
  hidden: boolean,
  reason?: string | null,
): Promise<void> {
  const status = hidden ? "hidden" : "active";
  await prisma.$transaction(async (tx) => {
    const oldValue = await readFieldValue(tx, marketId, "status");
    await writeFieldValue(tx, marketId, "status", status);
    await tx.changeHistory.create({
      data: {
        marketId,
        field: "status",
        oldValue: oldValue ?? Prisma.JsonNull,
        newValue: status,
        actorId,
        action: "hide",
      },
    });
    await recordModerationAction(
      {
        actorId,
        action: hidden ? "hide_market" : "unhide_market",
        targetType: "market",
        targetId: marketId,
        reason,
      },
      tx,
    );
  });
}
