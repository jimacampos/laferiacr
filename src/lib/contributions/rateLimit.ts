import { prisma } from "@/lib/prisma";

import { RATE_LIMITS, type ContributionAction } from "./config";

/**
 * Durable, per-IP fixed-window rate limiter backed by Postgres (ADR-0012). Survives
 * Container Apps scale-to-zero (unlike in-memory counters). Records the attempt and
 * returns whether the caller is still within the allowance for the trailing window.
 *
 * Best-effort opportunistic pruning of old rows keeps the log small without a cron.
 */
export async function checkRateLimit(
  ipHash: string,
  action: ContributionAction,
): Promise<{ allowed: boolean; remaining: number }> {
  const { max, windowMs } = RATE_LIMITS[action];
  const since = new Date(Date.now() - windowMs);

  const recent = await prisma.contributionAttempt.count({
    where: { ipHash, action, createdAt: { gte: since } },
  });

  if (recent >= max) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.contributionAttempt.create({ data: { ipHash, action } });

  // Opportunistically prune rows older than the window (~1% of calls) to bound growth.
  if (Math.random() < 0.01) {
    await prisma.contributionAttempt
      .deleteMany({ where: { action, createdAt: { lt: since } } })
      .catch(() => undefined);
  }

  return { allowed: true, remaining: Math.max(0, max - recent - 1) };
}
