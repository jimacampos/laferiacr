import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { activeBan } from "@/lib/contributions/bans";
import { verifyCaptcha } from "@/lib/contributions/captcha";
import { getMarketIdBySlug } from "@/lib/contributions/proposals";
import { checkRateLimit } from "@/lib/contributions/rateLimit";
import { clientIp, clientIpHash } from "@/lib/contributions/request";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REASON_MAX_LENGTH = 500;

// Flag a market or proposal as inappropriate/incorrect (FR-18). Anonymous allowed,
// rate-limited + CAPTCHA-gated. For a market, `targetId` is its slug; for a proposal it is
// the proposal id. Phase 3 records reports; the moderation queue arrives in Phase 4.
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { targetType, targetId, reason, captchaToken } = body as {
    targetType?: unknown;
    targetId?: unknown;
    reason?: unknown;
    captchaToken?: string;
  };

  if (
    (targetType !== "market" && targetType !== "proposal") ||
    typeof targetId !== "string" ||
    targetId.length === 0
  ) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }
  if (
    reason !== undefined &&
    (typeof reason !== "string" || reason.length > REASON_MAX_LENGTH)
  ) {
    return NextResponse.json({ error: "invalid_reason" }, { status: 400 });
  }

  const ipHash = clientIpHash(request);
  const { allowed } = await checkRateLimit(ipHash, "report");
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const captchaOk = await verifyCaptcha(captchaToken, clientIp(request));
  if (!captchaOk) {
    return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
  }

  let resolvedTargetId = targetId;
  if (targetType === "market") {
    const marketId = await getMarketIdBySlug(targetId);
    if (!marketId) {
      return NextResponse.json({ error: "target_not_found" }, { status: 404 });
    }
    resolvedTargetId = marketId;
  } else {
    const proposal = await prisma.proposal.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!proposal) {
      return NextResponse.json({ error: "target_not_found" }, { status: 404 });
    }
  }

  const session = await auth();
  if (session?.user?.id && (await activeBan(session.user.id))) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }
  await prisma.report.create({
    data: {
      targetType,
      targetId: resolvedTargetId,
      reason: typeof reason === "string" ? reason.trim() || null : null,
      reportedBy: session?.user?.id ?? null,
    },
  });

  return NextResponse.json({ status: "open" }, { status: 201 });
}
