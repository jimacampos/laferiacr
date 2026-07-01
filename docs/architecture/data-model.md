# Data Model — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-07-01_

Logical data model for the community platform. Storage is **PostgreSQL Flexible Server + PostGIS**
([ADR-0004](../decisions/0004-database-postgresql-flexible.md)). This is a design reference, not a
migration script; final column types/indexes are settled during Phase 1.

## Design principles
- **Official list is seed truth.** Markets are seeded from the June 2026 spreadsheet; community input
  lives in `proposals`/`confirmations` and is **promoted** onto the market, never silently overwriting.
- **Auditable & reversible.** Every promoted change writes `change_history`; moderation writes
  `moderation_actions`.
- **Provenance everywhere.** Markets carry `source` (official vs community) and per-field freshness.

## Entity overview

```mermaid
erDiagram
  markets ||--o{ proposals : "has"
  proposals ||--o{ confirmations : "receives"
  markets ||--o{ reports : "flagged by"
  proposals ||--o{ reports : "flagged by"
  users ||--o{ confirmations : "casts"
  users ||--o{ proposals : "submits (nullable if anon)"
  users ||--o{ reports : "files"
  users ||--o{ user_roles : "granted"
  users ||--o{ market_submissions : "submits"
  market_submissions ||--o| markets : "promoted to"
  markets ||--o{ change_history : "records"
  users ||--o{ moderation_actions : "performs"
  markets ||--o{ moderation_actions : "targets"

  markets {
    uuid id PK
    text slug UK
    text name
    text region_id
    text region_name
    jsonb days
    text days_label
    text hours_text
    geography location
    text organizer
    text[] phones
    text source
    text status
    timestamptz updated_at
  }
  proposals {
    uuid id PK
    uuid market_id FK
    text field
    jsonb proposed_value
    uuid submitted_by FK
    text status
    int confirmations_count
    timestamptz created_at
  }
  confirmations {
    uuid id PK
    uuid proposal_id FK
    uuid user_id FK
    text vote
    timestamptz created_at
  }
  reports {
    uuid id PK
    text target_type
    uuid target_id
    uuid reported_by FK
    text reason
    text status
    timestamptz created_at
  }
  users {
    uuid id PK
    text external_id
    text email
    text display_name
    timestamptz created_at
    timestamptz updated_at
  }
  user_roles {
    uuid id PK
    uuid user_id FK
    text role
    text scope
    timestamptz granted_at
  }
  market_submissions {
    uuid id PK
    text name
    geography location
    jsonb details
    uuid submitted_by FK
    text status
    uuid promoted_market_id FK
    timestamptz created_at
  }
  moderation_actions {
    uuid id PK
    uuid actor_id FK
    text action
    text target_type
    uuid target_id
    text reason
    timestamptz created_at
  }
  change_history {
    uuid id PK
    uuid market_id FK
    text field
    jsonb old_value
    jsonb new_value
    uuid caused_by_proposal FK
    timestamptz created_at
  }
```

## Entities

### markets
Canonical record per feria. Seeded from the official list, enriched by the community.
- `slug`: the stable v0 identifier, **unique** — used as the idempotent seed/upsert key.
- `source`: `official` | `community`.
- `status`: `active` | `hidden` | `pending` (community-added awaiting confirmations).
- `region_id` + `region_name`: kept as a pair (rather than a single `region`) to preserve exact v0
  parity — the UI groups by `region_id` and labels with `region_name`.
- `days`: normalized canonical keys (`["fri","sat"]`) — see day-normalization below.
- `days_label`: the original Spanish day string (e.g. "Viernes - sábado"); stored for provenance.
- `hours_text`: human string now (e.g. "5am–3pm"); may become structured later. Null until known.
- `phones`: `text[]` — markets can list multiple contact numbers (v0 parity).
- `location`: PostGIS `geography(Point,4326)`, nullable until known.
- Per-field freshness/confidence derived from the latest promoted proposal.

> **Phase 1 implementation note.** The deployed `markets` table (Prisma model, see
> [ADR-0010](../decisions/0010-orm-prisma.md)) splits `region` into `region_id`/`region_name` and uses
> `phones text[]`, plus `slug` and `days_label`, to mirror `src/data/ferias.json` exactly. The PostGIS
> `location` column and its GiST index are created via raw SQL in the initial migration because Prisma
> does not natively type `geography`.

### proposals
A suggested change to **one field** of a market (`field` ∈ `hours` | `location` | other).
- `proposed_value` is JSON (string for hours; `{lat,lng}` for location).
- `submitted_by` nullable → **anonymous proposals allowed**.
- `status`: `pending` | `verified` | `superseded` | `rejected`.
- `confirmations_count` cached for quick threshold checks.

### confirmations
One **account-gated** vote on a proposal. `vote`: `confirm` | `reject`. Unique on
`(proposal_id, user_id)` → one vote per user. Reaching threshold **N** confirms promotes the proposal.

### reports
Flags on a market or proposal (`target_type` + `target_id`). Feeds the moderation queue
([moderation-trust](moderation-trust.md)). `status`: `open` | `actioned` | `dismissed`.

### users
Created on first sign-in via Entra External ID. **`external_id` is unique** and holds the token's
immutable `oid` claim (not `sub`); `email`/`display_name` are refreshed on each sign-in. Minimal PII
(see [security-privacy](security-privacy.md)). **Implemented in Phase 2** (`prisma/migrations/*_add_users`,
upserted from the Auth.js `jwt` callback in `src/auth.ts`); `user_roles` and the rest of the graph
below arrive in later phases.

### user_roles
Grants a `role` (`member` | `trusted` | `community_safety` | `super_admin`) with optional `scope`
(e.g. region) for future regional moderators. See [rbac](rbac.md).

### market_submissions
Proposed **new** markets (Phase 5). Holds candidate details until promoted to a real `markets` row;
`promoted_market_id` links the result. Duplicate detection on name + proximity before acceptance.

### moderation_actions
Append-only audit of moderator/admin actions (remove, hide, ban, override, revert) — who/what/why/when.

### change_history
Append-only record of every promoted field change (old → new, causing proposal) enabling display of
history and **revert**.

## Day normalization (carried from v0)
Spanish day strings (e.g. "Viernes - sábado") are split on `[-,/]| y ` and mapped to canonical
ordered keys `mon…sun`. `WEEKEND_DAYS = {fri,sat,sun}` drives the "this weekend" default. Logic lives
in `scripts/generate_data.py` and is reused when seeding.

## Promotion & versioning
1. Proposal collects confirmations.
2. At **N** confirms it becomes `verified`; the market's field is updated and `change_history` is written.
3. Competing proposals for the same field are `superseded`.
4. Moderators/admins can reject or revert, writing `moderation_actions` (+ `change_history`).

Threshold **N** and weighting are policy — see [moderation-trust](moderation-trust.md). **N is an open
question** (start simple, e.g. 2–3 unweighted).

## Seeding
Phase 1 loads `src/data/ferias.json` (from the official xlsx) into `markets` with `source=official`
via `prisma/seed.ts`. Re-seeding is idempotent (**upsert by `slug`**) and never clobbers
community-verified fields (`hours_text`/`location` are left untouched on update).
