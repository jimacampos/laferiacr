# Feature Specification: Home & Discovery Redesign (Name-First)

**Feature Branch**: `001-home-discovery-redesign`

**Created**: 2026-07-09

**Status**: Draft (migrated from `docs/` — Roadmap Phase 4.5)

**Input**: Migrated from `docs/product/roadmap.md` (§Phase 4.5), `docs/product/prd.md`
(FR-60–FR-67), `docs/product/personas.md`, `docs/accessibility.md`, and backlog
BL-023…BL-029 / OQ-013 / OQ-014.

> **Migration note**: Most of this feature is **already shipped on `dev`** (name-first home,
> redesigned cards, no weekend default, region removed, A–Z polish pass). It is captured here in
> Spec Kit format so the remaining decision (FR-66 "near me") and any follow-ups run through the
> `/speckit.*` flow. Shipped stories are marked ✅.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a specific market by name (Priority: P1) ✅ shipped

As a returning shopper who already knows the market they want, I want the home page to center on a
prominent **name search** so I can find that specific *feria* in seconds — without wading through a
time- or region-based view.

**Why this priority**: This is the primary job of the home page and the reframing that defines the
phase. The market's **name already implies its place**, so name-first is the fastest find path and
does not depend on location data (which was sparse).

**Independent Test**: Load the home page, type part of a market name, and confirm the list narrows
to matching markets (accent-insensitive) with the query visibly highlighted — delivering a usable
find experience on its own.

**Acceptance Scenarios**:

1. **Given** the home page, **When** I type a partial market name (with or without accents), **Then**
   the list filters to markets whose name matches and the matched substring is highlighted (`<mark>`).
2. **Given** an active search, **When** I press the clear (✕) control, **Then** the query resets and
   the full directory returns.
3. **Given** I am not typing in a field, **When** I press `/`, **Then** focus moves to the search
   input; **When** I am typing in a field, **Then** `/` is inserted normally (shortcut suppressed).
4. **Given** a query with no matches, **When** results are empty, **Then** a query-aware empty state
   is shown (naming the searched term).

---

### User Story 2 - Scan a redesigned, name-led market card (Priority: P1) ✅ shipped

As a shopper scanning results, I want each market card to **lead with the name** and show **days
open**, with a location indicator only when coordinates exist, so cards are quick to scan and not
cluttered with administrative detail.

**Why this priority**: The card is the core unit of the directory; leading with the name (and
dropping region/phone) directly supports the name-first job and reduces visual noise.

**Independent Test**: View the directory and confirm each card shows name + days, shows a 📍 map
link only for markets with coordinates, and shows neither region nor phone.

**Acceptance Scenarios**:

1. **Given** any market card, **When** it renders, **Then** the market **name** is the most prominent
   element and the **days open** are shown.
2. **Given** a market **with** coordinates, **When** its card renders, **Then** a 📍 location
   indicator links to the market's map (`/market/{slug}#location`).
3. **Given** a market **without** coordinates, **When** its card renders, **Then** the location line
   is simply omitted and the market is **not** penalized in the default ordering.
4. **Given** any market card, **When** it renders, **Then** **region and phone are absent** (phone
   remains on the market detail page).

---

### User Story 3 - Browse a scannable, paginated A–Z directory (Priority: P2) ✅ shipped

As someone browsing rather than searching, I want the directory grouped alphabetically and paginated
with an A–Z jump index, so the page stays light and I can jump to a letter quickly.

**Why this priority**: Makes the home feel intentionally designed within a no-photos/no-coordinates
data reality and keeps payloads small (performance), but it is secondary to the search itself.

**Independent Test**: Open the directory, confirm markets are grouped into alphabetical sections
paginated at 10 per page, and that tapping a present letter in the jump index moves to the page and
section containing it.

**Acceptance Scenarios**:

1. **Given** the directory, **When** it renders, **Then** markets are sorted by name and grouped into
   **alphabetical sections**, paginated **10 per page**, each section with a visible letter heading.
2. **Given** the A–Z jump index, **When** I tap a letter that has markets, **Then** the view switches
   to the page containing that letter and scrolls to its section.
3. **Given** a letter with no markets, **When** the index renders, **Then** that letter is
   disabled/inert (never a focus trap).
4. **Given** the pager, **When** I am on the first/last page, **Then** prev/next are disabled at the
   ends and the current page is marked `aria-current="page"`.

---

### User Story 4 - Optional day filtering, no time-based default (Priority: P2) ✅ shipped

As a shopper, I want day filtering to be optional and tucked away by default, because a market's
*scheduled* days are not a confirmation that it is open — so the home should not pretend to answer
"open this weekend".

**Why this priority**: Corrects a misleading default (scheduled ≠ confirmed open) while keeping day
filtering available for those who want it.

**Independent Test**: Load the home and confirm no "this weekend" pre-filter is applied; open the
collapsible day filter, pick a day, and confirm the list narrows.

**Acceptance Scenarios**:

1. **Given** a fresh home page load, **When** it renders, **Then** **no** time-based ("this weekend")
   filter is pre-applied (default day = all).
2. **Given** the day filter, **When** the page loads with no day set, **Then** the filter is
   **collapsed** (disclosure with `aria-expanded`); **When** a day is set, **Then** it auto-opens.
3. **Given** region was a former filter, **When** the home renders, **Then** **no region selector is
   present** in the primary UI (OQ-013 — removed).

---

### User Story 5 - "Near me" nearest markets (Priority: P2) 🔵 reconsidering (not yet built)

As a shopper open to discovering a market near my current location, I want an opt-in "near me" view
that sorts markets by distance, so I can find the closest option when I don't have a specific market
in mind.

**Why this priority**: Deferred while coordinate coverage was thin (2 of 66 at discovery). As of
2026-07-08 coverage reached ~55 of 73 active markets (~75%) via community location approvals, so the
data blocker is largely cleared and this is **ready to reconsider** (BL-027, OQ-014). It remains P2
because name-first already satisfies the primary job.

**Independent Test**: With geolocation consent granted, open "near me" and confirm markets with
coordinates are ordered nearest-first; without consent, the feature degrades to the normal directory.

**Acceptance Scenarios**:

1. **Given** I choose "near me", **When** the app requests location, **Then** it asks for **explicit,
   purpose-bound geolocation consent** (NFR-32) and works only after I grant it.
2. **Given** consent is granted, **When** the view renders, **Then** markets **with** coordinates are
   sorted nearest-first; markets **without** coordinates are listed without a distance (not hidden).
3. **Given** I decline consent, **When** I return to the home, **Then** the default name/day directory
   is shown and nothing about my location is stored.

### Edge Cases

- **No coordinates at all** for the current result set → "near me" shows a friendly "we can't sort by
  distance yet" state and falls back to the name directory.
- **Accents / ñ / casing** in the search query → matching and highlighting are accent- and
  case-insensitive.
- **Very long market names** → cards truncate gracefully without breaking the name-first hierarchy.
- **Letter with a single market** vs **absent letter** → present letters jump; absent letters are
  disabled and `aria-hidden`.
- **Rapid typing** → result count and highlighting stay in sync with the current query.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (FR-60) The home page MUST center a prominent **name-first search** that filters markets
  by name, accent-insensitive, as the primary find path.
- **FR-002** (FR-61) Market cards MUST lead with the **name** and show **days open**; they MUST show a
  location indicator **only when the market has coordinates** (linking to the map), and MUST NOT show
  region or phone.
- **FR-003** (FR-62) The home MUST NOT apply a time-based ("this weekend") default; day filtering MUST
  be optional.
- **FR-004** (FR-63) Region MUST NOT be a primary browse/filter axis on the home page (removed from the
  primary UI per OQ-013).
- **FR-005** (FR-64) Markets without coordinates MUST omit the location line gracefully and MUST NOT be
  penalized in the default name/day ordering.
- **FR-006** (FR-65) The home MUST present a short, welcoming **bilingual (ES/EN)** hero centered on the
  name search.
- **FR-007** (FR-67) The directory MUST be grouped into **alphabetical sections** and **paginated (10
  per page)**, with an **A–Z jump index** (present letters active, absent letters disabled), a
  **collapsible day filter** (auto-opens when a day is set), a search **clear (✕)** control, a **`/`**
  focus shortcut suppressed while typing, **match highlighting** via semantic `<mark>`, a live result
  count, and a query-aware empty state.
- **FR-008** (FR-66) The system SHOULD offer an opt-in **"near me"** distance-sorted view, gated on
  **explicit geolocation consent**, enabled now that most markets have coordinates. *(Reconsidering —
  the one remaining unshipped story.)*

### Key Entities *(include if feature involves data)*

- **Market**: `name`, `slug`, `days`/`days_label`, `location` (nullable coordinate), `source`
  (official/community), `status`. Region and phones exist on the entity but are **not surfaced** on the
  home card. (See `docs/architecture/data-model.md`.)
- **Visitor location** (transient, US5 only): the visitor's current coordinate, used **only at the
  moment of action** for distance sorting; **never stored** (see `docs/architecture/security-privacy.md`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** A returning user can locate a specific market by name in **seconds** (a few keystrokes),
  with the match visibly highlighted.
- **SC-002** The home page leads with names and shows days (and location where known); **region and
  phone no longer appear** on cards.
- **SC-003** The directory stays light: no more than **10 markets render per page**, with A–Z jump
  navigation to any present letter.
- **SC-004** The home applies **no** misleading time-based default; day filtering is opt-in.
- **SC-005** If/when "near me" ships, distance sorting works for the **~75%+** of active markets that
  have coordinates, and only activates after explicit consent with **no** personal-location storage.

## Assumptions

- Coordinate coverage is ~55/73 active markets (~75%) as of 2026-07-08 and continues to grow via
  community approvals; a bulk geocoding pass (BL-028) is treated as **likely unnecessary** (OQ-014 —
  leaning community-only).
- Name search reuses the existing accent-insensitive helpers in `src/lib/filters.ts` /
  `src/lib/search.ts`; region filter logic remains in code but is unused by the home UI.
- Accessibility requirements in `docs/accessibility.md` (semantic HTML, keyboard, contrast, ~44px
  targets, `<mark>` legibility) apply to every element of this feature.
- "Near me" (FR-008) is the only story requiring new consent-gated behavior; all other stories are
  already implemented on `dev`.
