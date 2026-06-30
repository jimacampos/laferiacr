# ADR-0010: ORM — Prisma (with the pg driver adapter)

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
Phase 1 moves data into PostgreSQL Flexible Server + PostGIS ([ADR-0004](0004-database-postgresql-flexible.md))
and needs a typed data-access layer with first-class migrations and seeding. The Phase 1 task list
left the ORM open (Prisma vs Drizzle). The model is relational with strong-consistency needs in later
phases (one-vote-per-user, promotion at threshold, auditable history) and a geospatial `location`
column. The team values migration/seed developer experience and type safety over hand-written SQL.

## Decision
Use **Prisma** (v7) as the ORM. Because Prisma 7 ships the query compiler, the client runs through a
**driver adapter** — `@prisma/adapter-pg` over `pg`. The PostGIS `geography(Point,4326)` column is
modelled as an `Unsupported(...)` field (Prisma does not natively type PostGIS); the extension and the
column/index are created via raw SQL in the initial migration. Migrations run with
`prisma migrate deploy`; the database is seeded from the official list via `prisma/seed.ts`.

## Consequences
- **Positive:** type-safe queries, declarative schema, and a clean migrate/seed workflow that fits the
  CI/CD pipeline ([infrastructure](../architecture/infrastructure.md)).
- **Positive:** the driver adapter keeps the runtime lean and works well with the Next.js standalone
  container; `@prisma/client`/`@prisma/adapter-pg`/`pg` are marked `serverExternalPackages`.
- **Negative:** PostGIS is not first-class — geospatial reads/writes (Phase 3) will use raw SQL or
  `$queryRaw` rather than the typed client.
- **Operational:** the Prisma client is generated (not committed); `prisma generate` runs on install
  and in the Docker build, so CI/CD must generate before building.
- **Neutral:** Drizzle was the main alternative (lighter, SQL-first, more natural PostGIS). Revisit only
  if PostGIS ergonomics or build/runtime overhead become painful.
