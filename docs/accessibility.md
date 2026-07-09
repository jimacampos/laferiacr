# Accessibility — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-07-08 (desktop nav dropdowns)_

Accessibility is a **product requirement**, not an afterthought. The app must work for a wide range of
people: tech-savvy early adopters (25–45) **and** older or non-technical shoppers, on modest phones
and slower connections. See personas in [product/personas.md](product/personas.md).

## Targets
- Aim for **WCAG 2.1 AA** as the guiding standard.
- Usable one-handed on a small phone, outdoors, in bright sun.
- Understandable by someone who is **not** comfortable with apps.

## Design principles
- **Plain language:** short, concrete words in both ES and EN; avoid jargon ("Suggest an edit", not
  "Submit a proposal mutation").
- **Big tap targets:** minimum ~44×44 px; generous spacing; no tiny links.
- **Readable type:** large base font; support **large-text** and **high-contrast** modes; respect the
  OS text-size setting.
- **Strong contrast:** meet AA contrast for text and key UI; don't rely on color alone (pair with
  icons/labels for badges like Verified).
- **Low-friction flows:** the most valuable action (suggest an edit) needs **no account**; minimize
  steps and typing; sensible defaults ("this weekend").
- **Forgiving input:** clear errors, easy undo, confirmation before destructive actions.
- **Works offline-ish & slow:** fast first paint (SSR), small payloads; PWA offline list later (Phase 7).

## Implementation guidelines
- **Semantic HTML** first (headings, lists, buttons vs links); ARIA only to fill gaps.
- Full **keyboard** operability; visible focus states.
- **Screen-reader** support: labels on icon buttons, alt text on images/photos, announced state
  changes (e.g. "Confirmed").
- **Forms:** associated labels, input types that trigger the right mobile keyboard, inline validation.
- **Maps:** every map action has a **non-map alternative** (e.g. type an address / drop-pin + manual
  entry) since maps are hard for some users and assistive tech.
- **Motion:** respect `prefers-reduced-motion`.
- **Bilingual:** language toggle is easy to find; `lang` attributes set correctly for assistive tech.
- **Primary navigation (header):** a sticky site header whose brand mark/wordmark is a link to home
  (`/`) with an accessible label. Primary links live in a `<nav aria-label>`; the current route is
  marked with `aria-current="page"` and a visible active style (not color alone). On desktop, related
  links are grouped under **dropdown menus** (`Contribute`, `More`): the trigger is a button with
  `aria-haspopup="menu"` + `aria-expanded` + `aria-controls`, the panel is `role="menu"` with
  `role="menuitem"` links, and it highlights when a child route is active. Each menu closes on Escape
  (returning focus to its trigger), outside click, focus leaving the menu, and navigation. On small
  screens the links collapse behind a **menu disclosure** button (`aria-expanded` + `aria-controls`)
  that opens a full-width list-row panel; it closes on navigation. The moderator-only entry is resolved
  server-side, never from a client claim.
- **Directory navigation (home):** the day filter is a **disclosure** (`aria-expanded` toggle) so it can
  be collapsed; the market list is **paginated** with a `<nav aria-label>` pager whose current page uses
  `aria-current="page"` and whose prev/next are disabled at the ends. The A–Z jump index is a `<nav>` of
  **buttons** that switch to the page containing a letter and scroll to its section (absent letters are
  inert/greyed `aria-hidden` labels, never focus traps); each section has a visible letter heading. The
  `/` search shortcut is a convenience only — it's suppressed while typing in a field and never the sole
  way to reach search (the input is always visible and tab-reachable). Name-match **highlighting** uses
  semantic `<mark>` (meaning survives with styles off) and must keep sufficient contrast.

## Testing
- Automated checks (e.g. axe / Lighthouse) in CI as the app grows.
- Manual keyboard-only and screen-reader passes (VoiceOver/TalkBack).
- **Real-user testing across age groups**, including older/non-technical users — a formal pass in
  **Phase 6** ([roadmap](product/roadmap.md)), with lightweight checks before then.
- Test on low-end Android and in bright outdoor conditions.

## Open questions
- Whether to ship dedicated "Senior mode" (extra-large, simplified) vs. scalable settings only.
- Which automated a11y gate to enforce in CI and at what threshold.
