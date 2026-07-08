import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { verifyCaptcha } from "@/lib/contributions/captcha";
import { requireWriter } from "@/lib/contributions/guards";
import { checkRateLimit } from "@/lib/contributions/rateLimit";
import { clientIp, clientIpHash } from "@/lib/contributions/request";
import {
  createSubmission,
  findDuplicateCandidates,
  listPendingSubmissions,
} from "@/lib/contributions/submissions";
import { validateSubmission } from "@/lib/contributions/validation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

// Community-submitted new markets (Phase 5, ADR-0009).
// GET  — paginated list of pending submissions for the public confirm queue.
// POST — create a new submission. Sign-in required (higher-risk than a field edit); the write is
//        rate-limited and CAPTCHA-gated, and banned accounts are refused. Likely duplicates are
//        returned as a soft warning but never block the submission.
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const page = Math.max(
    Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1,
    1,
  );

  const session = await auth();
  const { items, total } = await listPendingSubmissions(
    page,
    PAGE_SIZE,
    session?.user?.id,
  );

  return NextResponse.json({
    submissions: items,
    total,
    page,
    pageSize: PAGE_SIZE,
  });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  // Sign-in required; banned accounts refused.
  const gate = await requireWriter();
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const validated = validateSubmission(body);
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

  const { id } = await createSubmission(validated.value, gate.userId, ipHash);

  // Surface likely duplicates in the response so the client can inform the user (soft warning).
  const duplicates = await findDuplicateCandidates(
    validated.value.name,
    validated.value.location,
  );

  return NextResponse.json({ id, duplicates }, { status: 201 });
}
