-- Market location aids from the official source (Instagram feria listing).
-- Adds two nullable text columns to `markets`:
--   * reference_text — landmark-based point-of-reference direction (e.g. "Contiguo al
--     Pali"). Costa Rican addresses are landmark-based, so this often locates a feria
--     better than coordinates alone.
--   * map_url — a Google Maps link, to make the point easy to find on a map before
--     precise PostGIS coordinates exist.
-- Both are official-source fields written by the seed; authored manually to match the
-- Phase 1-4 style and applied via `prisma migrate deploy`.
-- See docs/architecture/data-model.md.

ALTER TABLE "markets" ADD COLUMN "reference_text" TEXT;
ALTER TABLE "markets" ADD COLUMN "map_url" TEXT;
