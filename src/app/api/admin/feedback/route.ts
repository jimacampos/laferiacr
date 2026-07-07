import { NextResponse } from "next/server";

import {
  getFeedbackQueue,
  isFeedbackStatus,
  setFeedbackStatus,
} from "@/lib/contributions/feedback";
import { requireCapability } from "@/lib/contributions/guards";

export const dynamic = "force-dynamic";

// Admin feedback view. GET lists feedback (newest first); POST updates one entry's review
// status (open → reviewed/archived). Community Safety or higher; authorization resolved from
// the DB, never client claims.
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("view_queue");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const limit = Math.min(
    Number.parseInt(url.searchParams.get("limit") ?? "100", 10) || 100,
    200,
  );
  const offset = Math.max(
    Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
    0,
  );

  const queue = await getFeedbackQueue(limit, offset);
  return NextResponse.json({ queue });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("view_queue");
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { id, status } = body as { id?: unknown; status?: unknown };

  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }
  if (!isFeedbackStatus(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const updated = await setFeedbackStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ status });
}
