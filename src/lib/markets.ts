import { ferias as staticFerias, regions as staticRegions } from "@/data/ferias";
import type { DayOfWeek, Feria, Region } from "@/data/types";
import { normalizeText } from "@/lib/filters";

export interface MarketsData {
  ferias: Feria[];
  regions: Region[];
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

  const ferias: Feria[] = rows
    .map((row) => ({
      id: row.slug,
      name: row.name,
      regionId: row.regionId,
      days: row.days as unknown as DayOfWeek[],
      daysLabel: row.daysLabel,
      administrator: row.organizer ?? "",
      phones: row.phones,
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
