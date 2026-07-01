import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { activeBan } from "@/lib/contributions/bans";
import { verifyCaptcha } from "@/lib/contributions/captcha";
import { getMarketIdBySlug } from "@/lib/contributions/proposals";
import { checkRateLimit } from "@/lib/contributions/rateLimit";
import { clientIp, clientIpHash } from "@/lib/contributions/request";
import { validateProposal } from "@/lib/contributions/validation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "../../../../../../generated/prisma/client";

export const dynamic = "force-dynamic";

// Create a hours/location proposal for a market. Anonymous submissions are allowed
// (ADR-0007); anonymous writes are rate-limited (ADR-0012) and CAPTCHA-gated when enabled.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const validated = validateProposal(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const ipHash = clientIpHash(request);
  const { allowed } = await checkRateLimit(ipHash, "proposal");
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const captchaToken = (body as { captchaToken?: string }).captchaToken;
  const captchaOk = await verifyCaptcha(captchaToken, clientIp(request));
  if (!captchaOk) {
    return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
  }

  const marketId = await getMarketIdBySlug(slug);
  if (!marketId) {
    return NextResponse.json({ error: "market_not_found" }, { status: 404 });
  }

  const session = await auth();
  const submittedBy = session?.user?.id ?? null;

  // Active-banned accounts cannot write (Phase 4). Anonymous submissions are unaffected here
  // but remain rate-limited + CAPTCHA-gated above.
  if (submittedBy && (await activeBan(submittedBy))) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }

  const proposal = await prisma.proposal.create({
    data: {
      marketId,
      field: validated.field,
      proposedValue: validated.value as Prisma.InputJsonValue,
      submittedBy,
      submitterIpHash: ipHash,
    },
    select: { id: true, field: true, status: true, createdAt: true },
  });

  return NextResponse.json(
    {
      id: proposal.id,
      field: proposal.field,
      status: proposal.status,
      createdAt: proposal.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
