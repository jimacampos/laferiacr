# Vision & Product Brief — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-06-30_

## The problem
Costa Rica's *ferias del agricultor* (farmer's markets) are a weekly ritual for fresh, affordable,
local produce. But the basic facts people need — **which market is open, on which day, and where** —
are scattered across PDFs, municipal pages, social media, and word of mouth. The official list is a
static spreadsheet that goes stale: hours change, locations move, and new markets appear with no easy
way for the public to know.

## Vision
> **A trustworthy, community-kept guide to every farmer's market in Costa Rica — so anyone can find
> when and where to go, and the people who actually attend keep the information fresh.**

La Feria CR starts as a simple directory (shipped as v0) and grows into a living, community-maintained
resource: people propose corrections (hours, location), signed-in users confirm them, and good
information rises to "verified" automatically — with lightweight governance to keep it safe.

## Target audience
- **Primary early adopters:** ~25–45, somewhat tech-savvy, already shop at or are curious about ferias.
- **Inclusivity goal (core, not optional):** the app must remain genuinely usable by **older and
  less tech-savvy people** — large text, plain language, low-friction flows, minimal required steps.
- **Contributors:** attendees who know a market's real hours/location; market organizers; volunteer
  community moderators.

See [personas.md](personas.md) for detailed profiles.

## Value proposition
- **For shoppers:** "Is there a market this weekend, and where?" answered in seconds — accurate
  because the community keeps it current.
- **For contributors:** an easy way to fix and improve their local market's info and see it trusted.
- **For organizers (later):** a channel to keep their market's details authoritative.

## North star feature (long-term)
**Photos of the market and its stalls** — so a market feels real and inviting before you go. This is
the experience we are ultimately building toward; earlier phases lay the trustworthy data foundation
it needs.

## Goals
- Make the "when & where" of every feria effortless to find on a phone.
- Keep data **fresh and trustworthy** through community contribution + confirmation.
- Stay **inclusive** — usable across ages and tech comfort levels.
- Operate at **low cost** (serverless Azure) while early.
- Preserve the **official list** as a reliable seed baseline that's never lost.

## Non-goals (for now)
- E-commerce / online ordering or payments.
- Vendor inventory management.
- A native mobile app (we revisit PWA + notifications later).
- Becoming a general events platform — scope stays on farmer's markets.

## Guiding principles
1. **Mobile-first & inclusive** — design for a phone in a hurry, and for someone who isn't tech-savvy.
2. **Low friction to contribute** — proposing is anonymous; only confirming needs an account.
3. **Trust by consensus, safety by roles** — community confirmations promote info; moderators/admins
   handle abuse.
4. **Never lose the official baseline** — community edits overlay official data.
5. **Cheap to run** — serverless, scale-to-zero, pay for what we use.
6. **Bilingual** — Spanish-first, English available.

## Success metrics (KPIs)
> Targets to be set after launch; listed here as the dimensions we will track.

| Theme | Example metrics |
| --- | --- |
| Reach | Monthly active users; returning users; weekend-session share |
| Data freshness | % of markets with a community-confirmed (verified) hours/location; median data age |
| Contribution | # proposals submitted; # confirmations; proposal→verified conversion rate |
| Coverage | # community-added markets; % markets with coordinates |
| Trust & safety | # reports; time-to-resolution; reverted/abusive edits rate |
| Inclusivity | Task success across age groups (usability testing); accessibility audit score |
| Cost | Azure spend per active user / per month |

## Related
- [prd.md](prd.md) — what we build · [roadmap.md](roadmap.md) — in what order
- [../architecture/overview.md](../architecture/overview.md) — how it's built on Azure
