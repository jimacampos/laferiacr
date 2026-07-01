import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  overrideField,
  revertField,
  setMarketHidden,
} from "@/lib/contributions/admin";
import { getMarketIdBySlug } from "@/lib/contributions/proposals";
import { isSuperAdmin } from "@/lib/contributions/roles";
import { validateProposal } from "@/lib/contributions/validation";

export const dynamic = "force-dynamic";

// Minimal break-glass admin (ADR-0013): a super_admin can override a field, revert to the
// previous value, or hide/unhide a market. Every action is audited via change_history.
// Authorization is resolved from the DB (`user_roles`), never client claims.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (!(await isSuperAdmin(userId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  const marketId = await getMarketIdBySlug(slug);
  if (!marketId) {
    return NextResponse.json({ error: "market_not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { action } = body as { action?: unknown };

  switch (action) {
    case "override": {
      const validated = validateProposal(body);
      if (!validated.ok) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }
      await overrideField(userId, marketId, validated.field, validated.value);
      return NextResponse.json({ status: "overridden" });
    }
    case "revert": {
      const { field } = body as { field?: unknown };
      if (field !== "hours" && field !== "location") {
        return NextResponse.json({ error: "invalid_field" }, { status: 400 });
      }
      const reverted = await revertField(userId, marketId, field);
      if (!reverted) {
        return NextResponse.json({ error: "no_history" }, { status: 404 });
      }
      return NextResponse.json({ status: "reverted" });
    }
    case "hide":
    case "unhide": {
      await setMarketHidden(userId, marketId, action === "hide");
      return NextResponse.json({ status: action === "hide" ? "hidden" : "active" });
    }
    default:
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
}
