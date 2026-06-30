# Personas — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-06-30_

Personas guide product and accessibility decisions. La Feria CR must serve both confident
smartphone users and people who find apps intimidating. Quotes are illustrative.

---

## 1. Marta — the tech-savvy early adopter
- **Age:** 34 · San José · marketing coordinator.
- **Tech comfort:** High. Lives on her phone, installs apps freely.
- **Context:** Wants fresh produce on weekends, tries new neighborhoods.
- **Goals:** See what's open this weekend nearby; quickly check the day and location.
- **Frustrations:** Outdated info; driving to a market that wasn't open.
- **How she helps:** Happy to **propose** corrections and **confirm** others' edits; will create an
  account if it's quick.
- **Design implications:** Fast filters, map, "this weekend" default, low-friction proposing.

> "If I see the hours are wrong, I'll fix them — but it has to take ten seconds."

---

## 2. Don Rafael — the older, non-tech shopper
- **Age:** 68 · Cartago · retired, long-time feria shopper.
- **Tech comfort:** Low. Uses a smartphone mainly for WhatsApp and calls; small text is hard.
- **Context:** Goes to the same market weekly; occasionally checks if hours changed for a holiday.
- **Goals:** Confirm his market's day/hours; maybe call to ask. Nothing complicated.
- **Frustrations:** Tiny buttons, jargon, English-only UIs, multi-step sign-ups, ads.
- **How he helps:** Rarely contributes, but may **tap "still correct"** if it's one obvious button.
- **Design implications (high priority):** **Large text & high-contrast option**, plain Spanish,
  big tap targets, `tel:` call buttons, no mandatory login to read or to do simple confirmations
  where allowed, minimal screens.

> "I just want to know if the market is open on Saturday. Don't make me sign up for anything."

---

## 3. Carlos — the market organizer / steward
- **Age:** 45 · Pérez Zeledón · runs the local *Centro Agrícola Cantonal* feria.
- **Tech comfort:** Medium.
- **Context:** Knows his market's real hours/location and when they change.
- **Goals:** Keep **his** market's info authoritative; correct mistakes fast; eventually add photos.
- **Frustrations:** Wrong info spreading; no official way to claim his market.
- **How he helps:** Power contributor; ideal future **Market Steward** (owns his market's data).
- **Design implications:** Path to verified/authoritative edits; later, steward role & claiming.

> "It's my feria — I should be able to keep its details right."

---

## 4. Sofía — the community-safety moderator
- **Age:** 29 · Heredia · volunteer, civic-minded, trusted community member.
- **Tech comfort:** High.
- **Context:** Cares about the project; willing to spend time keeping content clean.
- **Goals:** Review reports, remove inappropriate content, resolve conflicting edits.
- **Frustrations:** No tools to act on abuse; unclear rules.
- **How she helps:** Holds the **Community Safety** role; needs a reports queue and clear guidelines.
- **Design implications:** Moderation tooling, audit trail, clear [content guidelines](../community/content-guidelines.md).

> "Give me a simple queue and clear rules, and I'll keep the data honest."

---

## 5. (Backlog) Operator / Super Admin
- **Who:** Project maintainer/operator.
- **Goals:** Override any field, manage roles & moderators, configure thresholds, revert abuse.
- **Design implications:** Admin surface, full audit, reversible actions. See [rbac.md](../architecture/rbac.md).

---

## Cross-persona takeaways
- **Accessibility is a primary requirement**, driven by Don Rafael — see [accessibility.md](../accessibility.md).
- **Two friction tiers:** reading/simple actions must be effortless and login-free; trusted actions
  (confirming, moderating) justify an account.
- **Spanish-first**, English available.
- Contribution and governance map directly onto roles in [rbac.md](../architecture/rbac.md).
