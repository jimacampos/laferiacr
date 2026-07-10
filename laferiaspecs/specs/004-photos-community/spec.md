# Feature Specification: Photos (North Star) + Richer Community

**Feature Branch**: `004-photos-community`

**Created**: 2026-07-09

**Status**: Draft (migrated from `docs/` — Roadmap Phase 8, planned)

**Input**: Migrated from `docs/product/roadmap.md` (§Phase 8), `docs/product/vision.md`
(north star), `docs/product/prd.md` (FR-50, FR-51), `docs/architecture/overview.md`,
`docs/architecture/data-model.md`, `docs/architecture/security-privacy.md` (content safety), and
backlog BL-002…BL-005.

> **Migration note**: This phase is **planned, not yet built** and is the product's long-term **north
> star** (photos), followed by an ordered backlog of richer community features. Requirements are
> captured at the available level of detail; the backlog items (reviews, prices, favorites, steward)
> are **out of scope for this spec** beyond acknowledgement — each becomes its own spec later. Run
> `/speckit.clarify` and `/speckit.plan` before implementing photos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See photos of a market before I go (Priority: P1)

As a shopper deciding whether to visit, I want to see **photos of the market and its stalls**, so the
feria feels real and inviting before I make the trip.

**Why this priority**: Photos are the explicit **north star** experience (vision). Everything else in
this phase supports or follows them.

**Independent Test**: Open a market detail page that has approved photos and confirm they display in a
usable gallery; a market with no photos shows a clean empty state.

**Acceptance Scenarios**:

1. **Given** a market with approved photos, **When** I open its detail page, **Then** I see its photos
   in an accessible gallery (alt text, keyboard navigable).
2. **Given** a market with no photos, **When** I open its detail page, **Then** a clean, inviting
   "no photos yet" state is shown (optionally prompting a contribution).
3. **Given** a slow connection, **When** photos load, **Then** they are delivered efficiently (CDN,
   appropriately sized) and do not block the core market info.

---

### User Story 2 - Contribute a market photo safely (Priority: P1)

As a contributor who attends a market, I want to **upload a photo** of it, so others can see what it's
like — with the app handling safety and privacy for me.

**Why this priority**: Without a safe contribution path there are no photos; content-safety and
privacy handling are inseparable from allowing uploads.

**Independent Test**: Upload a photo as a signed-in user, confirm EXIF/GPS is stripped, confirm it
passes/deferred through content-safety screening, and confirm it appears only after it is allowed to
publish.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I upload a photo, **Then** it is accepted, **EXIF/GPS metadata is
   stripped**, and it enters content-safety screening.
2. **Given** an uploaded photo, **When** automated screening (Azure AI Content Safety) flags it,
   **Then** it is withheld pending **human Community Safety review** and not shown publicly.
3. **Given** a photo passes screening/review, **When** it is approved, **Then** it becomes visible on
   the market's detail page.
4. **Given** any published photo, **When** it is later reported, **Then** it enters the existing
   moderation queue and can be removed, with the action audited (`moderation_actions`).

---

### User Story 3 - Moderate reported/queued photos (Priority: P2)

As a Community Safety moderator, I want photos to flow through the same **reports queue** with
remove/hide tools, so abusive or inappropriate images can be handled with the audited, reversible
tooling we already use for text.

**Why this priority**: Extends the existing safety layer to a new content type; important but built on
already-shipped moderation infrastructure.

**Independent Test**: Report a published photo and confirm it appears in the moderation queue where a
moderator can remove it, with the action recorded.

**Acceptance Scenarios**:

1. **Given** a reported photo, **When** the moderator opens the queue, **Then** the photo target
   appears alongside other reportable targets, ranked as other reports are.
2. **Given** a moderator decision, **When** they remove a photo, **Then** it is taken down and the
   action is written to `moderation_actions`; **When** they dismiss, **Then** it stays and the report
   is resolved.
3. **Given** a temp-banned user, **When** they attempt to upload, **Then** the write is blocked by the
   existing ban guard.

### Edge Cases

- **Very large / unsupported image formats** → rejected with a clear, bilingual message and size/format
  guidance.
- **Photo with embedded location metadata** → GPS/EXIF is stripped on upload (privacy).
- **Content-safety provider unavailable** → uploads fail safe (withheld), never auto-published on error.
- **Licensing** → uploader must have rights; contribution grants the app a display/distribution license
  (UGC terms) and a takedown path exists.
- **Accessibility** → every photo has alt text; the gallery is keyboard and screen-reader operable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (FR-50) The system MUST allow **photo uploads** for markets/stalls by signed-in users.
- **FR-002** Uploaded photos MUST have **EXIF/GPS metadata stripped** on upload (privacy).
- **FR-003** Uploads MUST pass **automated content-safety screening** (Azure AI Content Safety) plus
  **human Community Safety review**, and MUST fail safe (withheld) when screening cannot complete.
- **FR-004** Approved photos MUST display on the market detail page in an **accessible** gallery (alt
  text, keyboard/screen-reader operable) and MUST be delivered efficiently (CDN, sized appropriately).
- **FR-005** Photos MUST be **reportable** and MUST flow through the existing moderation queue with
  remove/hide tooling, **audited** in `moderation_actions` and consistent with temp-ban write guards.
- **FR-006** Photo contribution MUST apply the **UGC license + content rules** at the point of upload,
  with a **takedown path** for IP/privacy complaints (`docs/architecture/security-privacy.md`).
- **FR-007** (FR-51) The following are acknowledged as an **ordered future backlog** and are **out of
  scope** for this spec (each will be its own spec): **reviews & ratings** (BL-002) → **products &
  seasonal prices** (BL-003) → **favorites & reminders** (BL-004) → **vendor/organizer official
  accounts / Market Steward** (BL-005).

### Key Entities *(include if feature involves data)*

- **Photo**: an uploaded image for a market/stall — storage reference (Blob), uploader, status
  (screening/pending/approved/removed), alt text, created-at, moderation linkage. *(New for Phase 8;
  schema TBD.)*
- **Market** (existing): gains a one-to-many relationship to approved photos.
- **Report** / **moderation_actions** (existing): extended to target photos (a new `target_type`).
- **Content-safety result**: the automated screening verdict attached to a photo pending review.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** A shopper can view **community photos** on a market's detail page, and markets without
  photos show an inviting empty state.
- **SC-002** A signed-in contributor can upload a photo that is **EXIF/GPS-stripped** and only appears
  publicly **after** passing safety screening/review.
- **SC-003** No photo is auto-published when content-safety screening **fails or is unavailable**.
- **SC-004** Reported photos are **moderatable** through the existing queue, with every action audited.
- **SC-005** Photos load **efficiently** (CDN-delivered, sized) and never block the core market info on
  slow connections.

## Assumptions

- Storage & delivery use **Azure Blob Storage + CDN** (`docs/architecture/overview.md`); content safety
  uses **Azure AI Content Safety** (`docs/architecture/security-privacy.md`).
- Exact image constraints (formats, max size, per-market/per-user upload limits) and the moderation
  workflow states are settled during `/speckit.plan`.
- The richer-community backlog (reviews, prices, favorites, steward) is deliberately **deferred** to
  later specs; only photos are specified here.
- UGC license wording is finalized before community launch (open question in `security-privacy.md`).
- Favorites (BL-004) may be shared with Phase 7 notifications ("hours changed" follow) — cross-phase
  dependency to confirm.
