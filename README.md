# La Feria CR 🧺

**Farmer's markets (ferias del agricultor) in Costa Rica — know when and where they're open.**

La Feria CR is a mobile-first web app that helps people find their nearest farmer's
market and the days it operates. It lists all 66 official markets across the country's
9 regional committees, defaulting to the ones open **this weekend**.

## Features

- 🗓️ **"This weekend" by default** — the most common question ("is there a market this
  weekend?") is answered the moment the page loads.
- 🔎 **Filter & search** — by day of the week, by region, or free-text search by town/place.
- 📞 **Tap to call** — phone numbers are `tel:` links for the market's administrator.
- 🌐 **Bilingual** — Spanish (default) and English, toggle in the header, choice remembered.
- 📱 **Mobile-first & responsive** — designed for phones, scales up to desktop.
- ⚡ **Static & fast** — data is bundled at build time; no backend required.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19
- TypeScript
- Tailwind CSS v4

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

## Project structure

```
docs/
  Lista_Ferias_del_Agricultor.xlsx   # source data (June 2026)
scripts/
  generate_data.py                   # xlsx -> JSON generator
src/
  app/                               # Next.js App Router (layout, page, styles)
  components/                        # Header, FilterBar, MarketCard, MarketList, …
  data/
    ferias.json                      # generated market data (source of truth for the app)
    ferias.ts                        # typed accessors
    types.ts                         # Feria / Region / DayOfWeek types
  i18n/                              # bilingual dictionaries + provider/hook
  lib/
    filters.ts                       # filtering, search & "this weekend" helpers
```

## Data

The market data comes from the official *Lista de Ferias del Agricultor* spreadsheet
(`docs/Lista_Ferias_del_Agricultor.xlsx`, June 2026). It is converted into a typed,
bundled JSON module that the app imports at build time.

The free-text "days" column (e.g. `"Viernes - sábado"`) is normalized into canonical
day-of-week keys (`["fri", "sat"]`) so it can be filtered reliably.

### Regenerating the data

If the spreadsheet is updated, regenerate `src/data/ferias.json`:

```bash
python3 -m pip install openpyxl   # one-time
python3 scripts/generate_data.py
```

## Notes & roadmap

- **Location** is shown by town and region name. The data has no street addresses or GPS
  coordinates, so v1 is list-based. The data model is kept simple so a map view can be
  layered on later.
- Market hours can change; the app reminds users to confirm with the market before visiting.
