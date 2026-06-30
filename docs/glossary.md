# Glossary — La Feria CR

**Status:** 🟡 Draft · _Last updated: 2026-06-30_

Shared vocabulary for the project. Domain terms include **ES↔EN** equivalents since the product and
source data are bilingual.

## Domain terms (ES ↔ EN)
| Spanish | English | Meaning |
| --- | --- | --- |
| **Feria del agricultor** | Farmer's market | A regular open-air market where producers sell directly. The app's core subject. |
| **Feria** | Market | Short form used throughout the app/data. |
| **Comité regional** | Regional committee | One of 9 regional bodies organizing ferias (from the official list). |
| **Ente administrador** | Administrator / managing entity | Organization that runs a given feria. |
| **Día de feria** | Market day | Day(s) a feria operates (mostly Saturdays in CR). |
| **Horario** | Hours / opening hours | When a feria is open (e.g. 5am–3pm). |
| **Ubicación** | Location | Where a feria is, including map coordinates. |
| **Organizador** | Organizer | Person/entity responsible for a feria. |
| **Steward / encargado de feria** | Market Steward | (Backlog) verified organizer/vendor account for a market. |

## Product & community terms
| Term | Meaning |
| --- | --- |
| **v0** | The shipped static, read-only directory app (baseline). |
| **Contribution** | Any community input: a proposal, new-market submission, confirmation, or report. |
| **Proposal** | A suggested change to one field (hours or location) of a market. |
| **Confirmation** | An account-gated vote agreeing a proposal is correct. |
| **Threshold N** | Number of confirmations needed to auto-promote a proposal to Verified. |
| **Verified** | Data confirmed by the community (or from the official list) — a trust badge. |
| **Needs confirmation** | Suggested data awaiting enough confirmations. |
| **Provenance** | Whether a market is **Official (2026 list)** or **Community-added**. |
| **Promotion** | The act of a proposal becoming the market's verified value. |
| **Supersede** | When a newer verified value replaces an older one. |
| **Report / flag** | Signaling content as wrong, fake, spam, or offensive. |
| **Break-glass** | Emergency Super-Admin override used before full moderation tooling exists. |

## Roles
| Role | Meaning |
| --- | --- |
| **Anonymous** | Not signed in; can browse, propose, submit, report. |
| **Member** | Signed-in user; can confirm/reject. |
| **Trusted** | Reputable contributor; weighted votes (later). |
| **Community Safety** | Moderator; removes bad content, resolves reports. |
| **Super Admin** | Operator; overrides, role management, config, revert. |

See [architecture/rbac.md](architecture/rbac.md) for full capabilities.

## Technical terms
| Term | Meaning |
| --- | --- |
| **SSR** | Server-Side Rendering (Next.js renders HTML on the server). |
| **PWA** | Progressive Web App — installable, offline-capable web app (Phase 7). |
| **RBAC** | Role-Based Access Control — permissions by role. |
| **ADR** | Architecture Decision Record (see [decisions/](decisions/README.md)). |
| **IaC** | Infrastructure as Code (Bicep templates). |
| **Bicep** | Azure's IaC language for declaring resources. |
| **ACA** | Azure Container Apps — the serverless container host. |
| **ACR** | Azure Container Registry — stores container images. |
| **PostGIS** | PostgreSQL extension for geospatial data/queries. |
| **Entra External ID** | Microsoft's customer identity (auth) service. |
| **Azure Maps** | Azure's mapping/geocoding service. |
| **Key Vault** | Azure secrets store. |
| **App Insights** | Application Insights — observability (logs/metrics/traces). |
| **WAF** | Web Application Firewall (via Front Door). |
| **OIDC** | OpenID Connect — the sign-in protocol used with Entra. |
| **OTP** | One-Time Passcode (email sign-in option). |
| **CDN** | Content Delivery Network — caches/delivers photos (Phase 8). |
| **MAU** | Monthly Active Users (identity pricing unit). |
| **Sybil attack** | Abuse using many fake identities to sway confirmations. |
