# La Feria CR — Skills

Reusable, project-scoped skills (matching the `.claude/skills/<name>/SKILL.md` convention). They are
loaded automatically and triggered by intent; you can also invoke one by name.

| Skill | Use it to… | Triggers on (examples) |
| --- | --- | --- |
| **start-phase** | Kick off implementation of a roadmap phase: reads the right docs, loads the phase task list into todos, creates a branch. | "let's start phase 1", "start working on it", "build the backend" |
| **backlog-add** | Capture a feature idea or open question into `docs/product/backlog.md` with a proper ID and row. | "add to the backlog", "log this idea", "note this for later" |
| **docs-check** | Validate which `docs/` files a change/PR should update; reports a checklist (can act as a pre-merge gate). | "do the docs need updating?", "before I open the PR", "docs impact" |

See `docs/product/roadmap.md`, `docs/product/phase-1-tasks.md`, and `docs/product/backlog.md` for the
content these skills operate on.
