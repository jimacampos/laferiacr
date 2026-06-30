---
name: start-phase
description: >
  Kick off implementation work on a phase of the La Feria CR roadmap. Use this skill whenever the user
  wants to start building, begin a phase, "start working on it", implement the next phase, set up the
  backend, or pick up roadmap work. It loads the right docs, turns the phase task list into tracked
  todos, and creates a working branch. Triggers on: "let's start phase 1", "start working on it",
  "begin implementation", "build the backend", "start the next phase", "set up the project to work on".
---

# Start a Roadmap Phase — La Feria CR

Bootstraps a focused implementation session for one phase of `docs/product/roadmap.md`.

## Steps

1. **Pick the phase.** If the user didn't say, ask which phase (default: the lowest-numbered phase not
   yet done). Read `docs/product/roadmap.md` for that phase's goal, dependencies, and exit criteria.

2. **Read the relevant docs** (only what the phase needs) so you implement against the spec:
   - Always: `docs/product/prd.md` (requirements), the phase section of `docs/product/roadmap.md`.
   - Phase 1 → `docs/architecture/infrastructure.md`, `docs/architecture/data-model.md`,
     ADR-0003/0004; and the checklist in `docs/product/phase-1-tasks.md`.
   - Phase 2 → `architecture/overview.md`, ADR-0005 (identity), ADR-0006 (maps).
   - Phase 3 → `architecture/data-model.md`, `architecture/moderation-trust.md`, ADR-0007/0008,
     `community/contributing.md`.
   - Phase 4 → `architecture/rbac.md`, `architecture/moderation-trust.md`.
   - Phase 5 → ADR-0009. Phase 6 → `accessibility.md`, `security-privacy.md`.
   - Phase 7 → roadmap (PWA). Phase 8 → `security-privacy.md` (UGC), `community/content-guidelines.md`.

3. **Load the task list into todos.** If a `docs/product/phase-N-tasks.md` exists, turn each unchecked
   item into a row in the `todos` SQL table (kebab-case IDs, gerund titles, enough detail to execute).
   Add `todo_deps` where order matters. If no task file exists, derive tasks from the roadmap phase and
   offer to save them as `docs/product/phase-N-tasks.md`.

4. **Create a working branch** off the default branch (`main`), e.g. `phase-1-backend-foundation`.
   Use the session's branch tooling if available; otherwise `git checkout -b <name> origin/main`.

5. **State the exit criteria** for the phase back to the user and confirm scope before coding.

6. **Work the todos** one at a time: mark `in_progress` → implement → run `npm run lint && npm run build`
   → mark `done`. Keep changes surgical and aligned with the docs.

7. **Before opening a PR**, run the **`docs-check`** skill to update any affected docs/ADRs.

## Notes
- Respect `AGENTS.md` (Next.js 16 has breaking changes — read `node_modules/next/dist/docs/` first).
- Phase 1's "definition of done" is **v0 parity, now DB-backed on Azure** — no UX change.
- Don't start a phase whose dependencies (per the roadmap graph) aren't done; flag it instead.
