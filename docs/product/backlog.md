# Backlog — La Feria CR

**Status:** 🟢 Living document · _Last updated: 2026-07-01_

The single place to capture future features and decisions that aren't in the active phase. Add items
with the **`backlog-add`** skill (it appends a row using the format below). Promote items into a phase
in the [roadmap](roadmap.md) when they're ready to schedule.

## How to use
- **IDs:** features use `BL-NNN`; open questions/decisions use `OQ-NNN`. Never reuse an ID.
- **Type:** `feature` · `enhancement` · `tech-debt` · `infra` · `research` · `decision`.
- **Priority:** `P1` (next up) · `P2` (soon) · `P3` (someday).
- **Status:** `idea` · `accepted` · `scheduled` (note phase) · `done` · `dropped`.
- Keep one line per item; link related docs/ADRs.

## Feature backlog
| ID | Title | Type | Priority | Status | Area / Phase | Notes & links |
| --- | --- | --- | :--: | --- | --- | --- |
| BL-001 | Photos of markets & stalls (north star) | feature | P1 | scheduled | Phase 8 | Blob+CDN + AI Content Safety; [roadmap](roadmap.md) |
| BL-002 | Reviews & ratings | feature | P2 | idea | Phase 8 backlog | After photos |
| BL-003 | Products & seasonal prices | feature | P2 | idea | Phase 8 backlog | Per-market product lists |
| BL-004 | Favorites & reminders | enhancement | P2 | idea | Phase 8 backlog | Needs accounts ([prd](prd.md)) |
| BL-005 | Vendor/organizer official accounts (Market Steward role) | feature | P3 | idea | Phase 8 backlog | Verified claim; [rbac](../architecture/rbac.md) |
| BL-006 | Reputation-weighted confirmations | enhancement | P2 | scheduled | Phase 6 | [moderation-trust](../architecture/moderation-trust.md) |
| BL-007 | Anti-sybil / anomaly heuristics | enhancement | P2 | scheduled | Phase 6 | Abuse resistance |
| BL-008 | PWA install + offline market list | feature | P2 | scheduled | Phase 7 | [roadmap](roadmap.md) |
| BL-009 | Opt-in push notifications ("open near you") | feature | P3 | scheduled | Phase 7 | Azure Notification Hubs |
| BL-010 | "Senior mode" (extra-large, simplified UI) | enhancement | P3 | idea | Accessibility | vs scalable settings; [accessibility](../accessibility.md) |
| BL-011 | Front Door + CDN caching for read-heavy browsing | infra | P3 | idea | Infra | Add when traffic warrants ([infrastructure](../architecture/infrastructure.md)) |
| BL-012 | Speed up CD deploy pipeline (~12 min/run) | tech-debt | P3 | idea | Infra / CI-CD | Revisit [cd.yml](../../.github/workflows/cd.yml): cache `npm ci`, skip redundant double bicep deploy + no-op `az acr build` layers, gate migrate/seed when unchanged |
| BL-013 | Add Google as an Entra External ID sign-in provider | enhancement | P3 | idea | Auth / Phase 2 follow-up | Nice-to-have one-tap login alongside working email OTP; portal-only (Google Cloud OAuth client → Entra IdP → add to user flow), no app code. [runbook](../../deploy/entra-external-id-setup.md), [ADR-0005](../decisions/0005-identity-entra-external-id.md); see [OQ-005](#open-questions--decisions-to-make) |
| BL-014 | "Needs verification" discovery view for signed-in users | enhancement | P2 | idea | Phase 3 follow-up | Dev testers can't easily find which ferias need validation — no way to discover markets with pending proposals or missing hours/location. Add a signed-in queue/filter surfacing markets that need confirmation (pending proposals awaiting votes, and/or null `hours_text`/`location`), ordered by need. Reuses `getMarketContributions`/`proposals` state; entry point from Header or home filter. [moderation-trust](../architecture/moderation-trust.md), [prd](prd.md), [phase-3-tasks](phase-3-tasks.md) |
| BL-015 | Non-map alternative for location editing (a11y) | enhancement | P2 | idea | Accessibility / Phase 3 follow-up | Location suggestion currently requires pin-drop or "use my location" — no keyboard/screen-reader-friendly path (e.g. address or manual lat/lng entry). Surfaced by docs-check on Phase 3. Add a text/address input as an equivalent to the map interaction in `SuggestLocation`. [accessibility](../accessibility.md), [phase-3-tasks](phase-3-tasks.md) |
| BL-016 | Enable CAPTCHA on anonymous contribution writes | enhancement | P2 | accepted | Anti-abuse / Phase 3 follow-up | Provider-agnostic CAPTCHA seam is already built and flag-gated **off** (rate limiting is live). To activate: pick a provider (hCaptcha / Cloudflare Turnstile), add keys to the env/Key Vault, flip the flag on dev, then verify before broad public launch. [ADR-0012](../decisions/0012-anti-abuse-rate-limiting-and-captcha.md), [security-privacy](../architecture/security-privacy.md) |
| BL-017 | Structured per-day hours + editable market days | feature | P2 | idea | Data model / Phase 3 follow-up | Tester feedback: a feria may operate on days not in our seeded `days`, and different days can have different schedules. Today `days` is a fixed seed list and `hours_text` is one free-text string for the whole market. Move toward structured, per-day hours (e.g. `{ fri: "6am–12pm", sat: "6am–2pm" }`) and let the community correct/add days via the contribution loop. Larger data-model change (may graduate to an ADR); structured hours were deferred in Phase 3. [data-model](../architecture/data-model.md), [prd](prd.md), [phase-3-tasks](phase-3-tasks.md) |

## Open questions / decisions to make
| ID | Question | Priority | Status | Related |
| --- | --- | :--: | --- | --- |
| OQ-001 | Confirmation threshold **N** starting value | P1 | ✅ resolved (Phase 3: **N = 2**, net confirmations; configurable via `CONFIRMATION_THRESHOLD`) | [moderation-trust](../architecture/moderation-trust.md), [ADR-0008](../decisions/0008-promotion-automated-confirmation-and-roles.md) |
| OQ-002 | When to enable reputation weighting of votes | P2 | open | [moderation-trust](../architecture/moderation-trust.md) |
| OQ-003 | Moderator vetting & regional scoping | P2 | open | [rbac](../architecture/rbac.md) |
| OQ-004 | Duplicate-detection strictness for new markets | P2 | open | [ADR-0009](../decisions/0009-community-submitted-markets.md) |
| OQ-005 | Entra sign-in providers beyond Google | P2 | open | [ADR-0005](../decisions/0005-identity-entra-external-id.md) |
| OQ-006 | Pin prod ACA to min-1 replica vs scale-to-zero | P2 | open | [infrastructure](../architecture/infrastructure.md) |
| OQ-007 | Private networking (VNet/Private Link) for DB | P3 | open | [infrastructure](../architecture/infrastructure.md) |
| OQ-008 | Show contributor display names publicly vs pseudonymous | P2 | open (Phase 3 default: **pseudonymous** — no public names) | [security-privacy](../architecture/security-privacy.md) |
| OQ-009 | Auto-quarantine threshold (reports before auto-hide) | P2 | open | [moderation-trust](../architecture/moderation-trust.md) |
| OQ-010 | Appeal channel & SLA | P3 | open | [content-guidelines](../community/content-guidelines.md) |
| OQ-011 | CI accessibility gate (tool + threshold) | P3 | open | [accessibility](../accessibility.md) |
| OQ-012 | Retention windows for IP/device abuse signals | P3 | open | [security-privacy](../architecture/security-privacy.md) |

---
_Add new items at the bottom of the relevant table via the **`backlog-add`** skill._
