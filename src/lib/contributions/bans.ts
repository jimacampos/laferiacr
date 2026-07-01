import { prisma } from "@/lib/prisma";

import {
  BAN_DURATIONS,
  banExpiry,
  isBanActive,
  isBanDuration,
  type BanDuration,
  type BanWindow,
} from "./bansPolicy";
import { recordModerationAction } from "./moderation";

// Temp-bans (Phase 4, ADR-0014). An active ban blocks all writes. The pure helpers
// (duration presets, expiry math, active check) live in bansPolicy.ts and are re-exported
// here for back-compat; `activeBan`/`createBan`/`liftBan` are the DB-backed operations.

export {
  BAN_DURATIONS,
  banExpiry,
  isBanActive,
  isBanDuration,
  type BanDuration,
  type BanWindow,
};

export interface ActiveBan {
  id: string;
  reason: string | null;
  /** Null = permanent. */
  expiresAt: Date | null;
}

/** The user's currently-active ban, if any (most recent wins). Null when not banned. */
export async function activeBan(userId: string): Promise<ActiveBan | null> {
  const now = new Date();
  return prisma.userBan.findFirst({
    where: {
      userId,
      liftedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, reason: true, expiresAt: true },
  });
}

export type CreateBanResult =
  | { ok: true; banId: string; expiresAt: Date | null }
  | { ok: false; error: "user_not_found" };

/** Ban a user for a preset duration (or permanently) and audit it. */
export async function createBan(
  actorId: string,
  userId: string,
  duration: BanDuration,
  reason?: string | null,
): Promise<CreateBanResult> {
  const expiresAt = banExpiry(duration);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) return { ok: false, error: "user_not_found" } as const;

    const ban = await tx.userBan.create({
      data: {
        userId,
        reason: reason?.trim() || null,
        createdBy: actorId,
        expiresAt,
      },
      select: { id: true },
    });
    await recordModerationAction(
      {
        actorId,
        action: "ban_user",
        targetType: "user",
        targetId: userId,
        reason,
        metadata: { duration, expiresAt: expiresAt?.toISOString() ?? null },
      },
      tx,
    );
    return { ok: true, banId: ban.id, expiresAt } as const;
  });
}

/** Lift a ban early. Returns false when the ban is missing or already lifted. Audited. */
export async function liftBan(actorId: string, banId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const ban = await tx.userBan.findUnique({
      where: { id: banId },
      select: { id: true, userId: true, liftedAt: true },
    });
    if (!ban || ban.liftedAt !== null) return false;

    await tx.userBan.update({
      where: { id: banId },
      data: { liftedAt: new Date(), liftedBy: actorId },
    });
    await recordModerationAction(
      {
        actorId,
        action: "lift_ban",
        targetType: "user",
        targetId: ban.userId,
        metadata: { banId },
      },
      tx,
    );
    return true;
  });
}
