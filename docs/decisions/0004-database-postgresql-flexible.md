# ADR-0004: Database — PostgreSQL Flexible Server + PostGIS

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
The community platform needs relational integrity across markets, proposals, confirmations, users,
roles, reports, and audit history, plus **geospatial** queries ("markets near me", pin storage). The
data is naturally relational with strong consistency needs (one-vote-per-user, promotion at threshold,
auditable history). Options considered: Azure Cosmos DB (great scale, weaker relational/transactional
ergonomics for this model, geo less natural), Azure SQL (capable, but Postgres+PostGIS is the
geospatial sweet spot and lower cost at small scale), and PostgreSQL Flexible Server.

## Decision
Use **Azure Database for PostgreSQL Flexible Server** (Burstable tier to start) with the **PostGIS**
extension for geospatial data and queries. Access via an ORM (Prisma or Drizzle).

## Consequences
- **Positive:** strong relational integrity and transactions for the confirmation/promotion logic;
  first-class geospatial via PostGIS; low cost on Burstable; familiar SQL tooling.
- **Positive:** Burstable + stop-when-idle (non-prod) supports the cost goal.
- **Negative:** a single server is the main stateful component → needs backups/DR and (eventually)
  connection pooling and possibly private networking.
- **Neutral:** Postgres-vs-Cosmos was close; **revisit only** if write-scale or global distribution
  demands change (open question noted).
