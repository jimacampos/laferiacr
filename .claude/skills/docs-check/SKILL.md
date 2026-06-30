---
name: docs-check
description: >
  Check whether project documentation needs updating for a code change or pull request in La Feria CR.
  Use this skill before opening or finalizing a PR, when the user asks "do the docs need updating?",
  "did I miss any docs?", "validate documentation", "is this PR doc-complete?", or as a pre-merge gate.
  It maps changed files to the docs they likely affect and reports a checklist of docs to review.
  Triggers on: "check the docs", "do docs need updating", "before I open the PR", "docs impact",
  "validate documentation", "did we update the docs", "pre-merge doc check".
---

# Documentation Impact Check — La Feria CR

Determines which `docs/` files a change should update, so documentation never drifts from the code.

## Steps

1. **Get the change set.** Determine the diff against the base branch:
   ```bash
   git fetch -q origin
   git diff --name-status origin/main...HEAD     # or the PR base
   ```
   Also note new/removed files and any new dependencies.

2. **Map changed paths → docs** using the table below. Collect every doc whose triggers match.

3. **Check freshness.** For each implicated doc, see whether it was *also* modified in this change set.
   - If a relevant doc **was not** touched → flag it as **"review/update needed"**.
   - If it was touched → mark **"updated ✓"** and sanity-check the edit actually covers the change.

4. **Check for new decisions.** If the change introduces a significant, hard-to-reverse choice (new
   service, framework, data store, auth flow, major policy), require a **new ADR** in `docs/decisions/`
   and an entry in `docs/decisions/README.md`.

5. **Check cross-cutting docs:** new domain term → `glossary.md`; user-facing flow change →
   `product/prd.md` + `product/roadmap.md`; UI affecting a11y → `accessibility.md`; new contributor
   action or rule → `community/*`.

6. **Report** a concise checklist: `Doc — status (updated ✓ / review needed) — why`. Offer to make the
   updates. Bump each edited doc's `_Last updated:_` footer. **Do not** silently rewrite docs without
   surfacing the list first.

## Path → docs mapping
| Changed area (paths) | Docs to review |
| --- | --- |
| `src/data/**`, ORM models, `migrations/**`, `scripts/generate_data.py` | `architecture/data-model.md` |
| `src/lib/filters.ts`, market query/display logic | `architecture/data-model.md`, `product/prd.md` |
| auth / login / identity, session, tokens | `architecture/security-privacy.md`, `architecture/rbac.md`, `decisions/0005-identity-entra-external-id.md` |
| roles, permissions, moderation, reports | `architecture/rbac.md`, `architecture/moderation-trust.md`, `decisions/0008-*` |
| contribution / propose / confirm flow | `architecture/moderation-trust.md`, `decisions/0007-*`, `community/contributing.md` |
| new-market submission | `decisions/0009-*`, `architecture/data-model.md` |
| `infra/**`, `*.bicep`, `Dockerfile`, `.github/workflows/**` | `architecture/infrastructure.md`, `decisions/0003-*`, `decisions/0004-*` |
| maps / geocoding | `architecture/overview.md`, `decisions/0006-*` |
| photos / blob / CDN / content safety | `architecture/security-privacy.md`, `community/content-guidelines.md` |
| UI components, styling, flows | `accessibility.md`, `product/prd.md` |
| new user-facing feature | `product/prd.md`, `product/roadmap.md`, maybe `product/backlog.md` |
| any significant architectural choice | **new ADR** in `docs/decisions/` + `decisions/README.md` |
| new/renamed domain or technical term | `glossary.md` |

## Notes
- This is advisory by default. To use it as a hard **pre-merge gate**, treat "review needed" on a
  high-signal doc (data-model, rbac, infrastructure, security-privacy, or a missing ADR) as a blocker.
- Keep judgments high-signal: only flag docs genuinely affected, not every doc on every change.
- Could be wired into CI later as a check; for now it's run on demand or before opening a PR.
