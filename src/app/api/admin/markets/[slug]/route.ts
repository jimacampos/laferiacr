import { NextResponse } from "next/server";

import {
  overrideField,
  revertField,
  setMarketHidden,
} from "@/lib/contributions/admin";
import { requireCapability } from "@/lib/contributions/guards";
import { getMarketIdBySlug } from "@/lib/contributions/proposals";
import { validateProposal } from "@/lib/contributions/validation";

export const dynamic = "force-dynamic";

// Market-level moderation (Phase 4, ADR-0014; extends the Phase 3 break-glass of ADR-0013).
// hide/unhide are available to Community Safety; direct field override and revert are
// Super-Admin structural powers. Every action writes change_history (field diffs) and
// moderation_actions (the governance action). Authorization resolves from the DB, never claims.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { action, reason } = body as { action?: unknown; reason?: unknown };
  const reasonText = typeof reason === "string" ? reason : null;

  // Each action requires its own capability; resolve the guard per action so hide/unhide can
  // be Community Safety while override/revert stay Super Admin.
  const capability =
    action === "override"
      ? "override_field"
      : action === "revert"
        ? "revert"
        : action === "hide" || action === "unhide"
          ? "hide_market"
          : null;
  if (capability === null) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  const gate = await requireCapability(capability);
  if (!gate.ok) return gate.response;
  const userId = gate.userId;

  const { slug } = await params;
  const marketId = await getMarketIdBySlug(slug);
  if (!marketId) {
    return NextResponse.json({ error: "market_not_found" }, { status: 404 });
  }

  switch (action) {
    case "override": {
      const validated = validateProposal(body);
      if (!validated.ok) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }
      await overrideField(userId, marketId, validated.field, validated.value, reasonText);
      return NextResponse.json({ status: "overridden" });
    }
    case "revert": {
      const { field } = body as { field?: unknown };
      if (field !== "hours" && field !== "location") {
        return NextResponse.json({ error: "invalid_field" }, { status: 400 });
      }
      const reverted = await revertField(userId, marketId, field, reasonText);
      if (!reverted) {
        return NextResponse.json({ error: "no_history" }, { status: 404 });
      }
      return NextResponse.json({ status: "reverted" });
    }
    case "hide":
    case "unhide": {
      await setMarketHidden(userId, marketId, action === "hide", reasonText);
      return NextResponse.json({ status: action === "hide" ? "hidden" : "active" });
    }
    default:
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
}

