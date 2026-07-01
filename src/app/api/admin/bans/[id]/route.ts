import { NextResponse } from "next/server";

import { liftBan } from "@/lib/contributions/bans";
import { requireCapability } from "@/lib/contributions/guards";

export const dynamic = "force-dynamic";

// Lift a ban early (Phase 4). Community Safety or higher; audited. DB-resolved authorization.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("ban_user");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  try {
    const body = (await request.json()) as { action?: unknown };
    if (body.action !== undefined && body.action !== "lift") {
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }
  } catch {
    // Empty body is allowed — lifting needs no payload.
  }

  const lifted = await liftBan(gate.userId, id);
  if (!lifted) {
    return NextResponse.json({ error: "ban_not_found" }, { status: 404 });
  }
  return NextResponse.json({ status: "lifted" });
}
