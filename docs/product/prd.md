# Product Requirements (PRD) — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-06-30_

This PRD describes **what** we build, grouped by release. The **order** of delivery is in
[roadmap.md](roadmap.md); the **how** is in the [architecture](../architecture/overview.md) docs.

Requirement IDs: `FR-#` functional, `NFR-#` non-functional. User stories use
"As a … I want … so that …" with acceptance criteria (AC).

---

## Releases at a glance
| Release | Theme | Status |
| --- | --- | --- |
| **v0** | Static directory (read-only) | ✅ Shipped |
| **Community v1** | Hours + location, propose → confirm → verify | Planned (Phases 1–3) |
| **Governance** | Roles, moderation, community-submitted markets | Planned (Phases 4–5) |
| **Hardening** | Trust weighting + accessibility | Planned (Phase 6) |
| **Engagement** | PWA + notifications | Planned (Phase 7) |
| **Rich content** | Photos & beyond | Planned (Phase 8) |

---

## v0 — Shipped (baseline)
- **FR-1** List all official markets (66) with name, region, days, organizer, phones.
- **FR-2** Default view shows markets open **this weekend** (Fri–Sun).
- **FR-3** Filter by day and region; accent-insensitive text search by place.
- **FR-4** Tap-to-call (`tel:`) for organizer phone numbers.
- **FR-5** Bilingual ES/EN toggle; Spanish default; choice persisted.
- **NFR-1** Mobile-first, responsive; statically prerendered; no backend.

---

## Community v1 — Hours + Location (Phases 1–3)

### Data & accounts
- **FR-10** Seed all markets from the official list into a database; official values are the
  baseline and are never lost (community data overlays them).
- **FR-11** Each market has a **detail page** showing current hours, location, day(s), organizer,
  and a **freshness/confidence** indicator (verified vs needs confirmation, last-updated).
- **FR-12** Accounts via Entra External ID (Google + email OTP). **Reading requires no account.**

### Contributions (the core loop)
- **FR-13 Propose hours:** anyone (anonymous allowed) can propose opening hours for a market.
- **FR-14 Propose location:** anyone can set/correct a market's location by dropping a pin on a map
  or using their current GPS location.
- **FR-15 Confirm/reject:** **signed-in** users can confirm or reject a proposal.
- **FR-16 Auto-promotion:** when a proposal reaches the confirmation threshold **N**, it becomes the
  market's **verified** value and supersedes the previous one.
- **FR-17 Conflicts:** when multiple proposals exist for the same field, the most-confirmed wins;
  others are shown as alternatives.
- **FR-18 Report:** anyone can report a proposal or market as inappropriate/incorrect.

**User story — propose hours**
> As a shopper, I want to correct a market's hours so others aren't misled.
- **AC:** From a market page I can submit hours without logging in; my submission appears as
  "needs confirmation"; I see how many confirmations it needs.

**User story — confirm**
> As a signed-in member, I want to confirm correct info so it becomes trusted.
- **AC:** I can confirm/reject once per proposal; at **N** net confirmations the value flips to
  "verified" and shows an updated timestamp.

### Abuse controls
- **NFR-10** Per-IP rate limiting on submissions; CAPTCHA on anonymous submissions.
- **NFR-11** All promoted changes are recorded in history and are reversible.

---

## Governance — Roles & community-submitted markets (Phases 4–5)
- **FR-20** Role hierarchy: Anonymous, Member, Trusted, Community Safety, Super Admin
  (see [rbac.md](../architecture/rbac.md)).
- **FR-21 Community Safety** can remove inappropriate content, resolve reports, hide/disable a
  market, and temporarily ban abusers.
- **FR-22 Super Admin** can override any field, manage roles/moderators, configure threshold **N**,
  and revert history. All privileged actions are audited.
- **FR-23 Add a market:** users can submit a brand-new market (name, region, days, location, hours).
- **FR-24 Duplicate detection:** new submissions are checked against existing markets by name
  similarity and proximity before publishing.
- **FR-25 Provenance:** markets are labeled **"Official (2026 list)"** or **"Community-added"**.

---

## Hardening — Trust + accessibility (Phase 6)
- **FR-30** Confirmation weighting by contributor reputation (Trusted members count for more).
- **NFR-20 Accessibility:** large-text and high-contrast modes; plain-language copy; large tap
  targets; WCAG-aligned (see [accessibility.md](../accessibility.md)). Validated with users across
  age groups.
- **NFR-21** Anti-sybil heuristics; abuse monitoring/alerting; backups & DR.

---

## Engagement — PWA + notifications (Phase 7)
- **FR-40** Installable PWA; offline cache of the market list.
- **FR-41** Opt-in push notifications (e.g., "markets open near you this weekend", "hours changed").

---

## Rich content — Photos & beyond (Phase 8)
- **FR-50** Photo uploads for markets/stalls, with content-safety moderation and EXIF stripping.
- **FR-51 Backlog (ordered):** reviews & ratings → products & seasonal prices → favorites &
  reminders → vendor/organizer official accounts (Market Steward).

---

## Cross-cutting non-functional requirements
- **NFR-30 Performance:** fast first paint on mobile networks; market list usable within ~2s on 4G.
- **NFR-31 Cost:** serverless/scale-to-zero; low idle cost (see [infrastructure.md](../architecture/infrastructure.md)).
- **NFR-32 Privacy:** explicit consent for geolocation; clear handling of account data and
  user-generated content (see [security-privacy.md](../architecture/security-privacy.md)).
- **NFR-33 i18n:** all UI and key dynamic content available in ES and EN.
- **NFR-34 Observability:** centralized logs/metrics/traces for the API and app.

## Out of scope (current horizon)
Payments/e-commerce, vendor inventory, native apps, non-market events, real-time chat.
