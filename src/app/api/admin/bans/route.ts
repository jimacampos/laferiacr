import { NextResponse } from "next/server";

import { createBan, isBanDuration } from "@/lib/contributions/bans";
import { requireCapability } from "@/lib/contributions/guards";

export const dynamic = "force-dynamic";

// Temp-bans (Phase 4): a moderator bans a user for a preset duration (1d / 7d / 30d) or
// permanently. An active ban blocks all writes (enforced on the write routes). Audited;
// Community Safety or higher; DB-resolved authorization only.
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("ban_user");
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { userId, duration, reason } = body as {
    userId?: unknown;
    duration?: unknown;
    reason?: unknown;
  };

  if (typeof userId !== "string" || userId.length === 0) {
    return NextResponse.json({ error: "invalid_user" }, { status: 400 });
  }
  if (!isBanDuration(duration)) {
    return NextResponse.json({ error: "invalid_duration" }, { status: 400 });
  }
  if (userId === gate.userId) {
    return NextResponse.json({ error: "cannot_ban_self" }, { status: 400 });
  }

  const result = await createBan(
    gate.userId,
    userId,
    duration,
    typeof reason === "string" ? reason : null,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(
    { status: "banned", banId: result.banId, expiresAt: result.expiresAt },
    { status: 201 },
  );
}
