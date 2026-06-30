---
name: backlog-add
description: >
  Add an item to the La Feria CR product backlog (docs/product/backlog.md). Use this skill whenever the
  user wants to capture an idea, log a feature request, note something for later, file a future
  enhancement, or record an open question/decision to make. Triggers on: "add to the backlog",
  "log this idea", "capture this for later", "note this feature", "we should do X someday",
  "add an open question", "remember to decide X later", "put this on the backlog".
---

# Add a Backlog Item — La Feria CR

Appends a well-formed row to `docs/product/backlog.md`. Two tables live there: **Feature backlog**
(`BL-NNN`) and **Open questions / decisions** (`OQ-NNN`).

## Steps

1. **Classify the item.** Decide which table it belongs in:
   - A thing to *build/change* → **Feature backlog** (`BL`).
   - A thing to *decide/resolve* → **Open questions / decisions** (`OQ`).

2. **Gather fields** (ask only for what's missing; infer sensible defaults):
   - Feature: `Title`, `Type` (feature/enhancement/tech-debt/infra/research), `Priority` (P1/P2/P3),
     `Status` (default `idea`), `Area / Phase`, `Notes & links`.
   - Open question: `Question`, `Priority`, `Status` (default `open`), `Related` (doc/ADR links).

3. **Allocate the next ID.** Read `docs/product/backlog.md`, find the highest existing `BL-NNN` or
   `OQ-NNN`, and increment (zero-padded to 3). Never reuse an ID.

4. **Append the row** to the bottom of the correct table, matching the existing column order exactly.
   Use relative links for any referenced docs/ADRs. Keep it to one line.

5. **Bump the footer** `_Last updated:_` date to today.

6. **Confirm** to the user: show the new ID and the row you added. If the item is significant enough to
   schedule, offer to also note a target phase in `docs/product/roadmap.md`.

## Format reference
```
| BL-0NN | <Title> | <type> | <P#> | <status> | <area/phase> | <notes & links> |
| OQ-0NN | <Question> | <P#> | <status> | <related links> |
```

## Notes
- Don't create duplicates — scan existing titles/questions first and link/update instead if it exists.
- A backlog item that becomes a real architectural decision should graduate into a new **ADR**
  (`docs/decisions/`), not just a backlog row.
- This skill edits docs only; it never schedules or implements work.
