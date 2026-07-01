import { NextResponse } from "next/server";

import { requireCapability } from "@/lib/contributions/guards";
import {
  getReportQueue,
  resolveReportsForTarget,
} from "@/lib/contributions/moderation";

export const dynamic = "force-dynamic";

// Moderation reports queue (Phase 4). GET returns open reports grouped by target, ranked by
// open-report count; POST resolves or dismisses all open reports on a target. Community Safety
// or higher; authorization is resolved from the DB, never client claims. There is no
// auto-quarantine (OQ-009 deferred) — the queue only surfaces counts for manual action.
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("view_queue");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const limit = Math.min(
    Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50,
    100,
  );
  const offset = Math.max(
    Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
    0,
  );

  const queue = await getReportQueue(limit, offset);
  return NextResponse.json({ queue });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("resolve_reports");
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { targetType, targetId, decision, reason } = body as {
    targetType?: unknown;
    targetId?: unknown;
    decision?: unknown;
    reason?: unknown;
  };

  if (targetType !== "market" && targetType !== "proposal") {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }
  if (typeof targetId !== "string" || targetId.length === 0) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }
  if (decision !== "resolve" && decision !== "dismiss") {
    return NextResponse.json({ error: "invalid_decision" }, { status: 400 });
  }

  const closed = await resolveReportsForTarget(
    gate.userId,
    targetType,
    targetId,
    decision,
    typeof reason === "string" ? reason : null,
  );
  return NextResponse.json({ status: decision, closed });
}
