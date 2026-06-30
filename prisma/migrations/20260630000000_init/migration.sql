-- Phase 1 initial migration: markets table (v0 parity) + PostGIS.
-- Authored manually (no DB available in-session); applied via `prisma migrate deploy`.

-- Enable PostGIS for the geography(Point,4326) location column and geo queries.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "markets" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "region_name" TEXT NOT NULL,
    "days" JSONB NOT NULL,
    "days_label" TEXT NOT NULL,
    "hours_text" TEXT,
    "organizer" TEXT,
    "phones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" geography(Point, 4326),
    "source" TEXT NOT NULL DEFAULT 'official',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markets_slug_key" ON "markets"("slug");

-- CreateIndex
CREATE INDEX "markets_region_id_idx" ON "markets"("region_id");

-- CreateIndex (spatial)
CREATE INDEX "markets_location_idx" ON "markets" USING GIST ("location");
