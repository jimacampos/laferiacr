import { NextResponse } from "next/server";

import { getViewerAccess } from "@/lib/contributions/access";

export const dynamic = "force-dynamic";

// Lightweight viewer-access probe for the client Header. Returns the signed-in viewer's own
// coarse moderation flags (resolved from user_roles in the DB) so the UI can show or hide the
// Admin entry. Never a claim from the client; members simply get { isModerator: false }.
export async function GET() {
  const access = await getViewerAccess();
  return NextResponse.json({
    isModerator: access.isModerator,
    isSuperAdmin: access.isSuperAdmin,
  });
}
