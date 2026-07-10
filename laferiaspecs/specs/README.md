# Spec Kit specs — La Feria CR

This folder holds **Spec Kit feature specs** for La Feria CR's forward-looking roadmap phases. It was
seeded by migrating the relevant `docs/` into the Spec Kit format so future work runs through the
`/speckit.*` flow. The project's governing principles live in
[`../.specify/memory/constitution.md`](../.specify/memory/constitution.md) (v1.0.0).

> **Scope of this migration**: only **in-progress / future** phases were converted (4.5, 6, 7, 8).
> Shipped phases (1–5) and Phase 4 remain documented in [`../../docs/`](../../docs/), which stays the
> authoritative reference for everything already built, plus ADRs, architecture, personas, and glossary.

## Phase → spec mapping

| Spec | Roadmap phase | Status | Primary source docs |
| --- | --- | --- | --- |
| [`001-home-discovery-redesign`](001-home-discovery-redesign/spec.md) | Phase 4.5 — Home & discovery (name-first) | Mostly shipped on `dev`; "near me" reconsidering | roadmap §4.5, prd FR-60…67, personas, accessibility, BL-023…029, OQ-013/014 |
| [`002-trust-accessibility-hardening`](002-trust-accessibility-hardening/spec.md) | Phase 6 — Trust & accessibility | Planned | roadmap §6, prd FR-30 / NFR-20/21, accessibility, moderation-trust, security-privacy |
| [`003-pwa-notifications`](003-pwa-notifications/spec.md) | Phase 7 — PWA + notifications | Planned | roadmap §7, prd FR-40/41, overview, infrastructure, BL-008/009 |
| [`004-photos-community`](004-photos-community/spec.md) | Phase 8 — Photos (north star) + richer community | Planned | roadmap §8, vision (north star), prd FR-50/51, overview, data-model, security-privacy |

## What's in each spec folder

- **`spec.md`** — the *what/why*: prioritized user stories (P1/P2/P3) with acceptance scenarios,
  Functional Requirements (FR-###), measurable Success Criteria (SC-###), Key Entities, edge cases, and
  assumptions. Migrated from the source docs above.
- **`plan.md`** — the *how*: Technical Context, a Constitution Check against the v1.0.0 principles, the
  source-code structure, and links to the relevant ADRs/architecture docs.
- **`tasks.md`** — **not** included yet. Generate it with `/speckit.tasks` once a spec's plan is ready.

## Continuing the flow

For any spec here:

1. `/speckit.clarify` — resolve the open questions listed at the bottom of the plan (planned phases
   have several).
2. `/speckit.plan` — refine `plan.md` and produce design docs (`research.md`, `data-model.md`,
   `contracts/`, `quickstart.md`).
3. `/speckit.tasks` — generate `tasks.md` from the plan.
4. `/speckit.implement` — execute the tasks.

To spec a **new** feature from scratch, use `/speckit.specify`, which creates the next
`NNN-feature-name/` folder here automatically.

## Relationship to `docs/`

`docs/` remains the living reference (vision, PRD, roadmap, ADRs, architecture, personas, accessibility,
glossary). These specs **link back** to `docs/` rather than duplicating it; when a spec and a doc
disagree, prefer the spec for *forward-looking* feature scope and `docs/` for shipped behavior and
cross-cutting reference.
