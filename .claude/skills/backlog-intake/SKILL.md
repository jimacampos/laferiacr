---
name: backlog-intake
description: >
  Run a rapid, interactive intake session to capture MANY backlog items in one back-and-forth, then
  batch-write them into docs/product/backlog.md. Use this when the user wants to brain-dump several
  ideas/changes/bugs before moving on (distinct from backlog-add, which files a single item). Triggers
  on: "backlog intake", "let's capture some ideas", "I have a few changes to note", "brain dump",
  "capture these before the next phase", "let's do a backlog session", "I want to log a bunch of things".
---

# Backlog Intake (batch capture) — La Feria CR

Runs the loop: user drops ideas one at a time → you ask ONLY the clarifying questions you need →
stash each as a draft → at the end, batch-append well-formed rows to `docs/product/backlog.md`
(reusing the [`backlog-add`](../backlog-add/SKILL.md) format and ID rules).

## Steps

1. **Open the session.** Confirm the loop in one line: "Give me one idea at a time; I'll ask what I
   need, note it, and we'll move on. At the end I'll write them all to the backlog." Then create a
   scratch table in the session DB so nothing is lost between turns:
   ```sql
   CREATE TABLE IF NOT EXISTS backlog_drafts (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL, summary TEXT, kind TEXT, area TEXT,
     priority TEXT, notes TEXT, status TEXT DEFAULT 'draft',
     created_at TEXT DEFAULT (datetime('now'))
   );
   ```

2. **Per idea:**
   - **Check for duplicates first** — scan `docs/product/backlog.md` (and the drafts table) for an
     existing item; if it overlaps, say so and cross-reference instead of blindly duplicating.
   - **Ask only what's missing.** Prefer ONE focused multiple-choice question (use the ask_user tool,
     recommended option first). Don't over-interrogate — infer sensible defaults (type, priority, area).
   - **Record the draft** with `INSERT INTO backlog_drafts (...)`, then give a one-line ✅ confirmation
     and prompt for the next idea. Keep momentum; don't summarize the whole list each time.

3. **Classify** each draft for the target table: build/change → **Feature backlog** (`BL-NNN`);
   decide/resolve → **Open questions** (`OQ-NNN`). Types: `feature · enhancement · bug · tech-debt ·
   infra · research · decision`. Priority: `P1` next up · `P2` soon · `P3` someday. Default status `idea`.

4. **On "that's it" / done:** allocate the next IDs (read the file, find the highest `BL`/`OQ`, increment,
   zero-padded, never reuse), append one row per draft to the correct table matching the column order
   exactly, use relative doc/ADR links, and bump the `_Last updated:_` footer to today. Mark the drafts
   `status = 'added'`.

5. **Confirm** the batch: list the new IDs + titles. Offer to open a small PR for the backlog change.

## Format reference
```
| BL-0NN | <Title> | <type> | <P#> | <status> | <area/phase> | <notes & links> |
| OQ-0NN | <Question> | <P#> | <status> | <related links> |
```

## Notes
- This is the multi-item sibling of **backlog-add**; for a single quick item, use that instead.
- Keep each captured item to one line in the file; put context/open questions in the notes column.
- An item that's really an architectural decision should graduate into an **ADR** (`docs/decisions/`),
  not just a backlog row — flag it when that's the case.
- Docs-only skill: it captures and files items; it never schedules or implements the work.
