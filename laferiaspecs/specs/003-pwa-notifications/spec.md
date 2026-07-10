# Feature Specification: PWA + Notifications

**Feature Branch**: `003-pwa-notifications`

**Created**: 2026-07-09

**Status**: Draft (migrated from `docs/` — Roadmap Phase 7, planned)

**Input**: Migrated from `docs/product/roadmap.md` (§Phase 7), `docs/product/prd.md`
(FR-40, FR-41, NFR-30/32/33), `docs/architecture/overview.md`,
`docs/architecture/infrastructure.md`, and backlog BL-008, BL-009.

> **Migration note**: This phase is **planned, not yet built**. Requirements are captured from the
> roadmap/PRD at the available level of detail. Run `/speckit.clarify` and `/speckit.plan` before
> implementation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install the app and browse offline (Priority: P1)

As a regular shopper, I want to **install La Feria CR** to my home screen and still see the market
list when I'm offline or on a poor connection, so I can check a market's day even at the feria with no
signal.

**Why this priority**: The installable + offline directory is the foundational PWA capability and is
independently valuable without notifications.

**Independent Test**: Install the PWA, go offline, open the app, and confirm the market list (last
cached) is still viewable.

**Acceptance Scenarios**:

1. **Given** a supported browser, **When** I visit the app, **Then** it is **installable** (valid web
   app manifest + service worker) and can be added to the home screen.
2. **Given** the app was opened online at least once, **When** I go offline and reopen it, **Then** the
   **market list is available from cache** and renders quickly.
3. **Given** I am offline, **When** I try an action that needs the network (e.g. confirm), **Then** I
   get a clear, plain-language message rather than a silent failure.
4. **Given** new market data is deployed, **When** I reconnect and reopen, **Then** the cached list
   updates (freshness strategy) without a hard reload trap.

---

### User Story 2 - Opt in to useful reminders (Priority: P2)

As a shopper, I want to **opt in** to a small number of genuinely useful push notifications — like
"markets open near you this weekend" or "a market's hours changed" — so I remember to go and stay up
to date, without being spammed.

**Why this priority**: Re-engagement is valuable but strictly secondary to the offline PWA, and it
depends on explicit consent, so it ships after the installable base.

**Independent Test**: Grant notification permission, trigger a qualifying event, and confirm a
relevant push arrives; revoke permission and confirm pushes stop.

**Acceptance Scenarios**:

1. **Given** the notifications setting, **When** I opt in, **Then** the browser permission is requested
   with clear, purpose-bound copy and my subscription is stored.
2. **Given** I have opted in, **When** a qualifying event occurs (e.g. hours changed for a market I
   follow, or markets near me this weekend), **Then** I receive a relevant push in my language.
3. **Given** I have not opted in, **When** qualifying events occur, **Then** I receive **no** pushes.
4. **Given** I opt out (or revoke browser permission), **When** events occur, **Then** pushes stop and
   my subscription is removed/deactivated.

### Edge Cases

- **Unsupported browser** (e.g. iOS limitations) → the app still works as a normal responsive site; PWA
  install / push degrade gracefully with no broken UI.
- **Stale cache** → a clear update path so users are never stuck on very old data.
- **Notification permission denied** → the opt-in UI reflects the denied state and doesn't nag.
- **"Near me" pushes** depend on location → require explicit consent (NFR-32) and never rely on stored
  background location.
- **Language** → notification copy respects the user's ES/EN choice (NFR-33).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (FR-40) The app MUST be an **installable PWA** (web app manifest + service worker) and MUST
  provide an **offline cache of the market list** viewable without a connection.
- **FR-002** The app MUST degrade gracefully on browsers/platforms that don't support install or push —
  the responsive site keeps working.
- **FR-003** Offline actions requiring the network MUST fail with clear, bilingual messaging rather than
  silently.
- **FR-004** The cache MUST have a defined **freshness/update strategy** so users receive updated data
  after reconnecting without being trapped on stale content.
- **FR-005** (FR-41) The app MUST support **opt-in push notifications**, requested with clear,
  purpose-bound consent, for a small set of useful events (e.g. "markets open near you this weekend",
  "hours changed").
- **FR-006** Notifications MUST be sent **only** to users who opted in, MUST respect the user's ES/EN
  language (NFR-33), and MUST be fully revocable (unsubscribe / permission revoke stops all pushes).
- **FR-007** "Near me" notifications MUST rely on **explicit geolocation consent** (NFR-32) and MUST NOT
  depend on stored personal-location history.

### Key Entities *(include if feature involves data)*

- **Push subscription**: a per-user (or per-device) push endpoint + keys and preferences (which event
  types, language), created on opt-in and removed on opt-out. *(New for Phase 7; schema TBD.)*
- **Notification event**: a triggerable event (hours changed, weekend-open-near-me) that fans out to
  matching, opted-in subscriptions.
- **Cached market list** (client): the offline snapshot of markets served by the service worker.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** A user can **install** the app and, while **offline**, still view the market list.
- **SC-002** Reopening after reconnect shows **updated** market data (no permanent stale-cache trap).
- **SC-003** Only **opted-in** users receive notifications; opting out **stops** them completely.
- **SC-004** Notifications arrive in the user's **chosen language** and are relevant to the triggering
  event.
- **SC-005** On unsupported browsers, the app remains **fully usable** as a responsive site with no
  broken PWA/push UI.

## Assumptions

- Push delivery uses **Azure Notification Hubs** (roadmap/BL-009) or an equivalent web-push mechanism;
  the exact provider and web-push protocol details are settled in `/speckit.plan`.
- The offline caching approach (service worker strategy: which routes/data are precached vs runtime
  cached) is decided during planning; the market list is the minimum offline surface.
- "Follow a market" (to receive its "hours changed" pushes) may be introduced here or reuse a
  favorites concept from Phase 8 (BL-004) — dependency to confirm in planning.
- Notifications reuse existing i18n dictionaries for ES/EN copy.
- Cost stays within the serverless/scale-to-zero posture (NFR-31); notification infrastructure is
  chosen with idle cost in mind (`docs/architecture/infrastructure.md`).
