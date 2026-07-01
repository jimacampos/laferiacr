import { NextResponse } from "next/server";

import { parseThreshold } from "@/lib/contributions/config";
import { requireCapability } from "@/lib/contributions/guards";
import { recordModerationAction } from "@/lib/contributions/moderation";
import {
  CONFIRMATION_THRESHOLD_KEY,
  getConfig,
  listConfig,
  setConfig,
} from "@/lib/contributions/settings";

export const dynamic = "force-dynamic";

// Admin-configurable settings (Phase 4, ADR-0015). GET lists current values; POST updates a
// key (currently the confirmation threshold N). Super Admin only; every change is audited with
// the previous and new value. Authorization resolves from the DB, never client claims.
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("configure_policy");
  if (!gate.ok) return gate.response;

  const settings = await listConfig();
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const gate = await requireCapability("configure_policy");
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { key, value } = body as { key?: unknown; value?: unknown };

  if (key !== CONFIRMATION_THRESHOLD_KEY) {
    return NextResponse.json({ error: "unknown_key" }, { status: 400 });
  }
  // N must be a positive integer; store the normalized string form.
  const raw = typeof value === "number" ? String(value) : String(value ?? "");
  const parsed = parseThreshold(raw);
  if (parsed === null) {
    return NextResponse.json({ error: "invalid_value" }, { status: 400 });
  }

  const previous = await getConfig(key);
  await setConfig(key, String(parsed), gate.userId);
  await recordModerationAction({
    actorId: gate.userId,
    action: "set_config",
    targetType: "config",
    targetId: null,
    metadata: { key, previous, value: String(parsed) },
  });

  return NextResponse.json({ status: "updated", key, value: String(parsed) });
}
