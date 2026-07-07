import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { activeBan } from "@/lib/contributions/bans";
import { createFeedback, validateFeedback } from "@/lib/contributions/feedback";
import { checkRateLimit } from "@/lib/contributions/rateLimit";
import { hashIp } from "@/lib/contributions/request";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Sign-in-only feedback channel. Unlike anonymous reports/proposals, sending feedback
// requires an account, so we authenticate first and attribute the entry to the user. Rate
// limiting is keyed per-user (hashed user id) to curb spam from a single account.
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { message, pageUrl } = body as { message?: unknown; pageUrl?: unknown };
  const validation = validateFeedback(message, pageUrl);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { allowed } = await checkRateLimit(hashIp(userId), "feedback");
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (await activeBan(userId)) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }

  // Guard against a valid session whose user row was deleted (FK would otherwise throw).
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  await createFeedback({
    submittedBy: userId,
    message: validation.message,
    pageUrl: validation.pageUrl,
  });

  return NextResponse.json({ status: "received" }, { status: 201 });
}
