import {
  dataGeneratedAt,
  ferias as staticFerias,
  getRegion,
  regions as staticRegions,
} from "@/data/ferias";
import type { DayOfWeek, Feria, Region } from "@/data/types";
import { normalizeText } from "@/lib/filters";

export interface MarketsData {
  ferias: Feria[];
  regions: Region[];
}

/** Geographic point for a market, when its coordinates are known (Phase 3+). */
export interface MarketLocation {
  lat: number;
  lng: number;
}

/** Full per-market record backing the detail page (`/market/[slug]`). */
export interface MarketDetail {
  /** Public identifier (the v0 slug). */
  id: string;
  /** Internal DB uuid; null in the static fallback (no contribution loop). */
  dbId: string | null;
  name: string;
  regionId: string;
  regionName: string;
  days: DayOfWeek[];
  daysLabel: string;
  /** Human-readable hours; null until contributed (Phase 3). */
  hoursText: string | null;
  /** Landmark-based point-of-reference direction (e.g. "Contiguo al Pali"); null when unknown. */
  referenceText: string | null;
  /** Google Maps link to the feria's location; null until provided. */
  mapUrl: string | null;
  organizer: string;
  phones: string[];
  /** PostGIS point; null until a location is known/contributed (Phase 3). */
  location: MarketLocation | null;
  /** Provenance: 'official' (seed list) | 'community' (added later). */
  source: string;
  /** Lifecycle status: 'active' | 'hidden' | 'pending'. */
  status: string;
  /** Last-updated timestamp used as a freshness signal (ISO string). */
  updatedAt: string;
}

/** Reads come from Postgres only when explicitly enabled; otherwise static parity. */
function isDbBacked(): boolean {
  return process.env.DATA_SOURCE === "db" && Boolean(process.env.DATABASE_URL);
}

/** Match v0 ordering: accent-insensitive, case-insensitive by name. */
function byName(a: { name: string }, b: { name: string }): number {
  return normalizeText(a.name).localeCompare(normalizeText(b.name));
}

/**
 * Single read-path entry point for the market list. Swaps the static JSON import for a
 * Postgres-backed query when DATA_SOURCE=db, mapping rows back to the v0 `Feria`/`Region`
 * shapes so the UI is byte-for-byte unchanged.
 */
export async function getMarketsData(): Promise<MarketsData> {
  if (!isDbBacked()) {
    return { ferias: staticFerias, regions: staticRegions };
  }

  const { prisma } = await import("./prisma");
  const rows = await prisma.market.findMany({ where: { status: "active" } });

  // `location` is an Unsupported PostGIS column, so findMany can't project it. Fetch the
  // set of active markets that have coordinates separately to drive the card's 📍 indicator.
  const located = await prisma.$queryRaw<{ slug: string }[]>`
    SELECT slug FROM markets WHERE status = 'active' AND location IS NOT NULL`;
  const locatedSlugs = new Set(located.map((r) => r.slug));

  const ferias: Feria[] = rows
    .map((row) => ({
      id: row.slug,
      name: row.name,
      regionId: row.regionId,
      days: row.days as unknown as DayOfWeek[],
      daysLabel: row.daysLabel,
      administrator: row.organizer ?? "",
      phones: row.phones,
      hasLocation: locatedSlugs.has(row.slug),
    }))
    .sort(byName);

  const regionNames = new Map<string, string>();
  for (const row of rows) {
    regionNames.set(row.regionId, row.regionName);
  }
  const regions: Region[] = [...regionNames.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort(byName);

  return { ferias, regions };
}

/** Row shape returned by the raw detail query (PostGIS point projected to lat/lng). */
interface MarketDetailRow {
  id: string;
  slug: string;
  name: string;
  region_id: string;
  region_name: string;
  days: DayOfWeek[];
  days_label: string;
  hours_text: string | null;
  reference_text: string | null;
  map_url: string | null;
  organizer: string | null;
  phones: string[];
  source: string;
  status: string;
  updated_at: Date;
  lat: number | null;
  lng: number | null;
}

/**
 * Single read-path entry point for one market's detail page. Uses the static JSON
 * (no hours/location yet) unless DATA_SOURCE=db, in which case it reads the row from
 * Postgres and projects the PostGIS `location` to lat/lng via ST_Y/ST_X. Returns null
 * when the slug is unknown so the route can render notFound().
 *
 * Public reads see only `status = 'active'` markets. Moderators pass `includeHidden` so a
 * hidden market can be opened (e.g. to review or unhide it); the returned `status` lets the
 * UI flag it.
 */
export async function getMarketBySlug(
  slug: string,
  opts: { includeHidden?: boolean } = {},
): Promise<MarketDetail | null> {
  if (!isDbBacked()) {
    const feria = staticFerias.find((f) => f.id === slug);
    if (!feria) return null;
    return {
      id: feria.id,
      name: feria.name,
      regionId: feria.regionId,
      regionName: getRegion(feria.regionId)?.name ?? "",
      days: feria.days,
      daysLabel: feria.daysLabel,
      hoursText: feria.hoursText ?? null,
      referenceText: feria.referenceText ?? null,
      mapUrl: feria.mapUrl ?? null,
      organizer: feria.administrator,
      phones: feria.phones,
      location: null,
      source: "official",
      status: "active",
      updatedAt: dataGeneratedAt,
      dbId: null,
    };
  }

  const { prisma } = await import("./prisma");
  const rows = await prisma.$queryRaw<MarketDetailRow[]>`
    SELECT id, slug, name, region_id, region_name, days, days_label, hours_text,
           reference_text, map_url,
           organizer, phones, source, status, updated_at,
           ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM markets
    WHERE slug = ${slug}
      AND (status = 'active' OR ${opts.includeHidden ?? false})
    LIMIT 1`;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    regionId: row.region_id,
    regionName: row.region_name,
    days: row.days,
    daysLabel: row.days_label,
    hoursText: row.hours_text,
    referenceText: row.reference_text,
    mapUrl: row.map_url,
    organizer: row.organizer ?? "",
    phones: row.phones,
    location:
      row.lat !== null && row.lng !== null
        ? { lat: row.lat, lng: row.lng }
        : null,
    source: row.source,
    status: row.status,
    updatedAt: row.updated_at.toISOString(),
  };
}