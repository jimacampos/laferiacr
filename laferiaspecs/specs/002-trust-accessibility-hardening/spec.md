# Feature Specification: Trust & Accessibility Hardening

**Feature Branch**: `002-trust-accessibility-hardening`

**Created**: 2026-07-09

**Status**: Draft (migrated from `docs/` — Roadmap Phase 6, planned)

**Input**: Migrated from `docs/product/roadmap.md` (§Phase 6), `docs/product/prd.md`
(FR-30, NFR-20, NFR-21), `docs/accessibility.md`, `docs/architecture/moderation-trust.md`
(OQ-002 reputation weighting, OQ-003 scoping), `docs/architecture/security-privacy.md`, and
backlog BL-010.

> **Migration note**: This phase is **planned, not yet built**. Requirements below are captured from
> existing docs at the level of detail available. Run `/speckit.clarify` and `/speckit.plan` before
> implementation; several items are intentionally marked as Assumptions rather than hard specs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trusted confirmations carry more weight (Priority: P1)

As the community, we want confirmations from **trusted contributors** to count for more than those
from brand-new accounts, so that verified data is harder to game and rises faster when reliable people
agree.

**Why this priority**: This is the core "trust" upgrade of the phase. Phase 3/4 used strict 1-user =
1-vote; reputation weighting (deferred from those phases via OQ-002) is the main new capability.

**Independent Test**: Give a Trusted member's confirmation a higher weight, submit confirmations from
mixed-reputation accounts on a proposal, and verify promotion occurs based on **weighted** net
confirmations rather than a raw count.

**Acceptance Scenarios**:

1. **Given** a pending proposal, **When** a Trusted member confirms it, **Then** their confirmation
   contributes **more** to the net total than a standard Member's, per the configured weighting.
2. **Given** weighted confirmations reach the effective threshold, **When** promotion runs, **Then**
   the value is promoted to verified exactly as in the existing loop (`change_history` recorded).
3. **Given** reputation weighting is configured off (fallback), **When** confirmations are counted,
   **Then** behavior matches the existing 1-user = 1-vote model (no regression).
4. **Given** the self-vote rule, **When** a proposer confirms their own proposal, **Then** it still
   does not count, regardless of reputation.

---

### User Story 2 - Large-text & high-contrast accessible modes (Priority: P1)

As Don Rafael (older, low-tech shopper), I want **large-text** and **high-contrast** modes plus
plain-language copy and big tap targets, so I can read and use the app comfortably outdoors and
without struggling with small controls.

**Why this priority**: Accessibility is a **core product requirement**, not polish (vision +
`accessibility.md`), and this phase is where the formal bar is met and validated with real users
across age groups.

**Independent Test**: Enable large-text mode and high-contrast mode and confirm the whole app remains
usable — text scales, contrast meets AA, tap targets stay ≥ ~44px, nothing overlaps or clips.

**Acceptance Scenarios**:

1. **Given** the accessibility settings, **When** I enable **large-text mode**, **Then** base type
   scales up app-wide without breaking layout, and the choice is remembered.
2. **Given** the accessibility settings, **When** I enable **high-contrast mode**, **Then** text and
   key UI meet WCAG 2.1 AA contrast and meaning is never conveyed by color alone.
3. **Given** the OS text-size setting, **When** it is increased, **Then** the app respects it.
4. **Given** `prefers-reduced-motion`, **When** it is set, **Then** non-essential motion is disabled.
5. **Given** any interactive control, **When** measured, **Then** its tap target is ≥ ~44×44px with
   adequate spacing.

---

### User Story 3 - Anti-sybil defenses & abuse monitoring (Priority: P2)

As a Community Safety moderator / operator, I want anti-sybil heuristics and abuse
monitoring/alerting, so coordinated fake accounts and attacks are detected and contained before they
distort verified data.

**Why this priority**: Reputation weighting raises the value of "trusted" accounts, which increases
the incentive to farm them — so anti-sybil defenses are a necessary companion, but they harden an
already-working safety layer rather than deliver a new user-facing capability.

**Independent Test**: Simulate anomalous confirmation patterns (many new accounts converging on one
proposal) and confirm the system flags/alerts and does not auto-promote on suspicious weight alone.

**Acceptance Scenarios**:

1. **Given** a burst of confirmations from newly-created, low-reputation accounts, **When** heuristics
   run, **Then** the pattern is flagged for moderator attention and does not silently auto-verify.
2. **Given** abuse monitoring, **When** anomalous activity crosses a threshold, **Then** an alert is
   raised to operators (observability/alerting).
3. **Given** a confirmed abuse case, **When** a moderator acts, **Then** existing revert/temp-ban tools
   apply and the action is audited in `moderation_actions`.

---

### User Story 4 - Conflict-resolution UX for disagreeing edits (Priority: P2)

As a shopper and as a moderator, I want persistent conflicts (flip-flopping values) surfaced clearly
and routed for resolution, so disagreement is visible and gets settled rather than silently churning.

**Why this priority**: Builds on the existing "show disagreement" behavior; improves trust legibility
but is an enhancement over an already-shipped conflict display.

**Independent Test**: Create competing proposals that flip-flop and confirm the UI shows the
disagreement clearly and escalates persistent conflict to the moderation queue.

**Acceptance Scenarios**:

1. **Given** multiple competing proposals for one field, **When** the detail page renders, **Then** the
   disagreement is shown (e.g. "2 say 5am, 1 says 6am"), not hidden.
2. **Given** repeated flip-flopping on a field, **When** it exceeds a threshold, **Then** it escalates
   to the moderation queue for human resolution.

### Edge Cases

- **Reputation exactly at a tier boundary** → weighting rule is deterministic and documented.
- **High-contrast + large-text together** → both apply without layout breakage.
- **Screen-reader announcement** of state changes (e.g. "Verified", "Confirmed") remains correct in
  both accessible modes.
- **False-report brigading** → consistent with Phase 4 policy, nothing is auto-hidden; monitoring
  raises signals, humans decide (no auto-quarantine — OQ-009).
- **Backups/DR event** → data restore path exists and is tested.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (FR-30) The system MUST weight confirmations by contributor **reputation**, so that
  Trusted members' confirmations count for more when computing net confirmations for promotion.
- **FR-002** Reputation weighting MUST be configurable and MUST safely fall back to 1-user = 1-vote,
  preserving the existing promotion loop and `change_history` behavior.
- **FR-003** (NFR-20) The app MUST provide **large-text** and **high-contrast** modes, respect the OS
  text-size setting and `prefers-reduced-motion`, use plain-language copy, and keep tap targets
  ≥ ~44px — validated against **WCAG 2.1 AA**.
- **FR-004** Accessibility MUST be **validated with real users across age groups** (including
  older/non-technical users), per `docs/accessibility.md` testing plan.
- **FR-005** (NFR-21) The system MUST apply **anti-sybil heuristics** and **abuse monitoring with
  alerting**, and MUST have **backups & disaster recovery** in place.
- **FR-006** Persistent conflicts MUST be surfaced clearly and **escalated** to the moderation queue
  for human resolution.
- **FR-007** All new moderation/trust decisions MUST remain **audited** (`moderation_actions`) and
  reversible (`change_history`), consistent with the existing safety layer.

### Key Entities *(include if feature involves data)*

- **Contributor reputation**: a per-user reputation signal (derived from confirmed contributions /
  trusted status) used to weight confirmations. *(New concept for Phase 6; schema TBD — see
  Assumptions.)*
- **Confirmation** (existing): gains a **weight** derived from the confirmer's reputation.
- **Abuse signal / alert**: anomaly detections surfaced to operators/moderators.
- **Accessibility preference**: user-selected large-text / high-contrast mode (persisted).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Verified data is **measurably harder to game**: a fixed number of low-reputation accounts
  can no longer force promotion that a smaller number of trusted confirmations would resist.
- **SC-002** The app meets a defined **WCAG 2.1 AA** bar (automated audit score threshold) and passes a
  **formal usability pass across age groups**, including older/non-technical users.
- **SC-003** Coordinated fake-account confirmation bursts are **flagged and alerted** rather than
  silently auto-verifying.
- **SC-004** A data-loss scenario can be **recovered** from a backup within the defined DR objective.
- **SC-005** No accessibility regression: large-text and high-contrast modes work together across all
  primary screens.

## Assumptions

- The reputation model and its exact weighting formula are **not yet decided** (OQ-002). This spec
  fixes the *requirement* (weighting exists, is configurable, degrades to 1-vote); the formula, tiers,
  and any schema (`reputation` field/table) are to be settled during `/speckit.plan` / `/speckit.clarify`.
- Regional scoping of moderators (OQ-003) stays **deferred**; `user_roles.scope` exists but is not
  enforced.
- Auto-quarantine remains **rejected** (OQ-009); monitoring informs humans, who act manually.
- The automated a11y gate (axe/Lighthouse) and its CI threshold are chosen in this phase (open question
  in `accessibility.md`); "Senior mode" (BL-010) vs scalable-settings-only is decided here.
- Backups/DR, WAF, and observability/alerting build on the Azure platform in
  `docs/architecture/infrastructure.md` and `docs/architecture/security-privacy.md`.
