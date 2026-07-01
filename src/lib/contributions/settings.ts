import { prisma } from "@/lib/prisma";

import { resolveThreshold } from "./config";

// Server-only accessor for admin-configurable settings stored in `app_config` (Phase 4,
// ADR-0015). Kept separate from config.ts so the pure/env constants there stay client-safe.
// Currently holds the confirmation threshold N; the resolver falls back to env then default
// so the app still works when the DB is unavailable or the row is missing.

export const CONFIRMATION_THRESHOLD_KEY = "confirmation_threshold";

/** Read a single config value, tolerating an unavailable DB (returns null to fall back). */
async function readConfig(key: string): Promise<string | null> {
  try {
    const row = await prisma.appConfig.findUnique({
      where: { key },
      select: { value: true },
    });
    return row?.value ?? null;
  } catch {
    return null;
  }
}

/** Resolve N with DB → env → default precedence (see resolveThreshold). */
export async function resolveConfirmationThreshold(): Promise<number> {
  const dbRaw = await readConfig(CONFIRMATION_THRESHOLD_KEY);
  return resolveThreshold(dbRaw, process.env.CONFIRMATION_THRESHOLD);
}

/** Current stored value for a config key (null when unset). */
export async function getConfig(key: string): Promise<string | null> {
  return readConfig(key);
}

export interface ConfigSetting {
  key: string;
  value: string;
  updatedAt: string;
}

/** All settings a Super Admin can view/edit (admin config screen). */
export async function listConfig(): Promise<ConfigSetting[]> {
  const rows = await prisma.appConfig.findMany({
    select: { key: true, value: true, updatedAt: true },
    orderBy: { key: "asc" },
  });
  return rows.map((row) => ({
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/** Upsert a config value, recording the Super Admin who changed it. */
export async function setConfig(
  key: string,
  value: string,
  updatedBy: string,
): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key },
    update: { value, updatedBy },
    create: { key, value, updatedBy },
  });
}
