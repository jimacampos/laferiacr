import { NextResponse } from "next/server";

// Liveness/readiness probe for Azure Container Apps. Kept dependency-free and dynamic
// so it always reflects the running instance.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
