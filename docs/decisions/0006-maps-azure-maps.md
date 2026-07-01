# ADR-0006: Maps — Azure Maps

**Status:** 🟢 Accepted
**Date:** 2026-06-30

## Context
The first community release shows **where** markets are and lets users **place/confirm a location**
(drop a pin or use current location). We need interactive map display, geocoding, and a point store.
We are committed to Azure and want a **single bill** and consistent governance. Alternatives
considered: Google Maps Platform and Mapbox (both capable, but add a separate vendor/billing/keys and
fall outside the Azure-native posture).

## Decision
Use **Azure Maps** (Web SDK + geocoding/search) for map display and location capture. Coordinates are
stored in PostGIS ([ADR-0004](0004-database-postgresql-flexible.md)).

## Consequences
- **Positive:** native Azure integration and billing; free monthly grant covers low traffic; keys
  managed in Key Vault; pairs with PostGIS for "near me".
- **Negative:** smaller ecosystem/community examples than Google/Mapbox; some features differ.
- **Neutral:** map provider is relatively swappable behind a thin client wrapper if needs change.

## Implementation notes (Phase 2)
- **No client key.** Rather than shipping a subscription key to the browser, the app grants its
  **managed identity** the *Azure Maps Data Reader* role and mints a short-lived **Entra token** in a
  server route (`/api/maps/token`); the Web SDK authenticates anonymously via a `getToken` callback.
- **Graceful degradation:** when `AZURE_MAPS_CLIENT_ID` is unset the map renders an "unavailable"
  note instead of failing. Pins appear once market coordinates are captured (Phase 3); until then the
  map shows a default Costa Rica view.
