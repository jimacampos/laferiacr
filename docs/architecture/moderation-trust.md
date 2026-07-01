# Moderation & Trust — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-07-01_

How community input becomes trustworthy "verified" data, and how abuse is contained. Combines an
**automated** confirmation loop ([ADR-0008](../decisions/0008-promotion-automated-confirmation-and-roles.md))
with a **human** safety layer ([rbac](rbac.md)). Entities in [data-model](data-model.md).

## Proposal lifecycle

```mermaid
stateDiagram-v2
  [*] --> pending: proposal submitted (anon ok)
  pending --> verified: net confirmations >= 2
  pending --> rejected: confirms reject / moderator rejects
  verified --> superseded: newer proposal verified
  pending --> superseded: a competing proposal verifies first
  rejected --> [*]
  superseded --> [*]
```

- **pending** — collecting account-gated confirmations.
- **verified** — reached threshold **N = 2**; value promoted onto the market (+ `change_history`).
- **superseded** — a newer verified proposal replaced this field's value.
- **rejected** — net-negative votes or moderator decision.

## Confirmation threshold (N)
- Promotion is automatic at **N = 2** net confirmations for the same proposed value, where
  `net = confirm_count - reject_count`. This resolves OQ-001.
- `CONFIRMATION_THRESHOLD` configures N (default 2); Super-Admin configuration is planned in Phase 4
  ([rbac](rbac.md)).
- **One-user-one-vote:** confirmations are unique per `(proposal_id, user_id)`.
- **Self-vote rule:** a signed-in proposer cannot confirm/reject their own proposal, and the
  proposer's vote never counts. Promotion requires N confirmations from other accounts; anonymous
  proposals start at 0.
- **Reputation weighting** (Trusted/mod votes count more) is **deferred to Phase 6**; v1 is 1 user = 1 vote.

## Conflict resolution
- Multiple competing proposals for the same field can be open at once; users confirm the one they
  believe. The **first to reach N wins**; others become `superseded`.
- Promotion also supersedes competing pending/verified proposals for the same market field.
- The detail page surfaces disagreement ("2 people say 5am, 1 says 6am") instead of hiding it.
- Persistent conflict (flip-flopping) escalates to the moderation queue.

## Reporting workflow

```mermaid
flowchart LR
  R[User files report] --> Q[Moderation queue]
  Q --> CS{Community Safety review}
  CS -->|valid| ACT[Remove / hide / revert / ban]
  CS -->|invalid| DIS[Dismiss]
  ACT --> AUD[(audit log)]
  DIS --> AUD
```

- Anyone (incl. anonymous) can report a market or proposal.
- Community Safety triages in Phase 4; Phase 3 break-glass actions are **reversible and audited** in
  `change_history`.
- Appeals go through [content-guidelines](../community/content-guidelines.md).

## Anti-abuse controls
| Vector | Control |
| --- | --- |
| Spam proposals | Per-IP/device **rate limits**; **CAPTCHA** on anonymous writes |
| Vote stuffing | **Account required** to confirm; one vote per user per proposal |
| Sock-puppets / sybil | Email-verified accounts; reputation + anomaly heuristics (Phase 6) |
| Bad new markets | Duplicate detection; pending until confirmed; moderation |
| Vandalism | Full history + **revert**; moderator removal; temp-bans |
| Coordinated attack | WAF/Front Door; alerting; Super-Admin break-glass overrides |

## Governance vs. automation
- **Automation** handles the happy path: propose → confirm → auto-verify. No human needed for normal edits.
- **Humans** (Community Safety, Super Admin) handle exceptions: abuse, conflicts, and policy. They do
  not gate everyday contributions.
- Promotions and break-glass actions write `change_history`, which enables display and revert.

## Trust signals shown to users
- Verified vs needs-confirmation badges; confirmation counts; last-updated; provenance
  (official vs community). These make data quality legible to non-technical users
  ([accessibility](../accessibility.md)).

## Open questions
- When to enable reputation weighting.
- Moderator vetting and regional scoping.
- Auto-quarantine thresholds (e.g. N reports auto-hide pending review).
- Duplicate-detection strictness for new markets.
