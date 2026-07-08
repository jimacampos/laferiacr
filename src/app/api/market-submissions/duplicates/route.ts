import { NextResponse } from "next/server";

import { CR_BOUNDS } from "@/lib/contributions/config";
import { findDuplicateCandidates } from "@/lib/contributions/submissions";
import type { LocationValue } from "@/lib/contributions/validation";

export const dynamic = "force-dynamic";

// Live soft-duplicate check for the new-market form (Phase 5, ADR-0009). Given a proposed name
// (and optional pin), returns likely-duplicate existing markets so the UI can warn before submit.
// Read-only; never blocks. Coordinates outside the CR bounds are ignored rather than erroring.
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const name = (url.searchParams.get("name") ?? "").trim();
  if (name.length === 0) {
    return NextResponse.json({ duplicates: [] });
  }

  const latRaw = url.searchParams.get("lat");
  const lngRaw = url.searchParams.get("lng");
  let location: LocationValue | null = null;
  if (latRaw !== null && lngRaw !== null) {
    const lat = Number.parseFloat(latRaw);
    const lng = Number.parseFloat(lngRaw);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= CR_BOUNDS.minLat &&
      lat <= CR_BOUNDS.maxLat &&
      lng >= CR_BOUNDS.minLng &&
      lng <= CR_BOUNDS.maxLng
    ) {
      location = { lat, lng };
    }
  }

  const duplicates = await findDuplicateCandidates(name, location);
  return NextResponse.json({ duplicates });
}
