import {
  CR_BOUNDS,
  HOURS_MAX_LENGTH,
  PROPOSAL_FIELDS,
  type ProposalField,
} from "./config";
import type { LocationValue } from "./types";

export type { LocationValue };

/** Max lengths for the free-text fields on a new-market submission. */
export const SUBMISSION_LIMITS = {
  name: 120,
  regionName: 80,
  daysLabel: 120,
  referenceText: 200,
  mapUrl: 500,
  organizer: 120,
  phone: 40,
  maxPhones: 5,
  maxDays: 7,
} as const;

/** Canonical day-of-week keys accepted on a submission (matches src/data/types DAYS_OF_WEEK). */
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAY_KEYS)[number];

/** Discriminated result of validating a proposal submission. */
export type ValidatedProposal =
  | { ok: true; field: "hours"; value: string }
  | { ok: true; field: "location"; value: LocationValue }
  | { ok: false; error: string };

function isProposalField(value: unknown): value is ProposalField {
  return (
    typeof value === "string" &&
    (PROPOSAL_FIELDS as readonly string[]).includes(value)
  );
}

/**
 * Validate an incoming proposal body. Returns a narrowed value on success or a stable
 * error code on failure. Kept dependency-free (no schema lib) to match repo conventions.
 */
export function validateProposal(body: unknown): ValidatedProposal {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "invalid_body" };
  }
  const { field, value } = body as { field?: unknown; value?: unknown };

  if (!isProposalField(field)) {
    return { ok: false, error: "invalid_field" };
  }

  if (field === "hours") {
    if (typeof value !== "string") {
      return { ok: false, error: "invalid_value" };
    }
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > HOURS_MAX_LENGTH) {
      return { ok: false, error: "invalid_value" };
    }
    return { ok: true, field: "hours", value: trimmed };
  }

  // field === "location"
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "invalid_value" };
  }
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  if (typeof lat !== "number" || typeof lng !== "number") {
    return { ok: false, error: "invalid_value" };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "invalid_value" };
  }
  if (
    lat < CR_BOUNDS.minLat ||
    lat > CR_BOUNDS.maxLat ||
    lng < CR_BOUNDS.minLng ||
    lng > CR_BOUNDS.maxLng
  ) {
    return { ok: false, error: "out_of_bounds" };
  }
  // Round to ~5 decimal places (~1m) to avoid storing spurious precision.
  const round = (n: number) => Math.round(n * 1e5) / 1e5;
  return { ok: true, field: "location", value: { lat: round(lat), lng: round(lng) } };
}

/** Validate a lat/lng pair against the CR bounds; returns a rounded value or an error code. */
function validateLocation(
  value: unknown,
): { ok: true; value: LocationValue } | { ok: false; error: string } {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "invalid_location" };
  }
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return { ok: false, error: "invalid_location" };
  }
  if (
    lat < CR_BOUNDS.minLat ||
    lat > CR_BOUNDS.maxLat ||
    lng < CR_BOUNDS.minLng ||
    lng > CR_BOUNDS.maxLng
  ) {
    return { ok: false, error: "out_of_bounds" };
  }
  const round = (n: number) => Math.round(n * 1e5) / 1e5;
  return { ok: true, value: { lat: round(lat), lng: round(lng) } };
}

/** Normalized, validated payload for a community-submitted new market. */
export interface ValidatedSubmission {
  name: string;
  regionId: string;
  regionName: string;
  days: DayKey[];
  daysLabel: string;
  hoursText: string | null;
  referenceText: string | null;
  mapUrl: string | null;
  organizer: string | null;
  phones: string[];
  location: LocationValue | null;
}

export type SubmissionResult =
  | { ok: true; value: ValidatedSubmission }
  | { ok: false; error: string };

function trimmedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) return null;
  return trimmed;
}

/**
 * Validate an incoming new-market submission (Phase 5, ADR-0009). Required: a name, a region
 * (id + name), and at least one canonical day. Optional: hours, a landmark reference, a map
 * URL, an organizer, phones, and a location pin (sanity-checked to the CR bounds). Returns a
 * narrowed, trimmed value or a stable error code. Dependency-free to match repo conventions.
 */
export function validateSubmission(body: unknown): SubmissionResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "invalid_body" };
  }
  const raw = body as Record<string, unknown>;

  const name = trimmedString(raw.name, SUBMISSION_LIMITS.name);
  if (!name) return { ok: false, error: "invalid_name" };

  const regionId = trimmedString(raw.regionId, SUBMISSION_LIMITS.regionName);
  const regionName = trimmedString(raw.regionName, SUBMISSION_LIMITS.regionName);
  if (!regionId || !regionName) return { ok: false, error: "invalid_region" };

  if (!Array.isArray(raw.days) || raw.days.length === 0) {
    return { ok: false, error: "invalid_days" };
  }
  const days: DayKey[] = [];
  for (const d of raw.days) {
    if (typeof d !== "string" || !(DAY_KEYS as readonly string[]).includes(d)) {
      return { ok: false, error: "invalid_days" };
    }
    if (!days.includes(d as DayKey)) days.push(d as DayKey);
  }
  // Store canonical keys in week order for parity with seeded markets.
  days.sort((a, b) => DAY_KEYS.indexOf(a) - DAY_KEYS.indexOf(b));

  const daysLabel =
    trimmedString(raw.daysLabel, SUBMISSION_LIMITS.daysLabel) ?? days.join(", ");

  const hoursText =
    raw.hoursText === undefined || raw.hoursText === null || raw.hoursText === ""
      ? null
      : trimmedString(raw.hoursText, HOURS_MAX_LENGTH);
  if (raw.hoursText && hoursText === null) {
    return { ok: false, error: "invalid_hours" };
  }

  const referenceText =
    raw.referenceText === undefined || raw.referenceText === null || raw.referenceText === ""
      ? null
      : trimmedString(raw.referenceText, SUBMISSION_LIMITS.referenceText);
  if (raw.referenceText && referenceText === null) {
    return { ok: false, error: "invalid_reference" };
  }

  let mapUrl: string | null = null;
  if (raw.mapUrl !== undefined && raw.mapUrl !== null && raw.mapUrl !== "") {
    const candidate = trimmedString(raw.mapUrl, SUBMISSION_LIMITS.mapUrl);
    if (!candidate || !/^https?:\/\//i.test(candidate)) {
      return { ok: false, error: "invalid_map_url" };
    }
    mapUrl = candidate;
  }

  const organizer =
    raw.organizer === undefined || raw.organizer === null || raw.organizer === ""
      ? null
      : trimmedString(raw.organizer, SUBMISSION_LIMITS.organizer);
  if (raw.organizer && organizer === null) {
    return { ok: false, error: "invalid_organizer" };
  }

  let phones: string[] = [];
  if (raw.phones !== undefined && raw.phones !== null) {
    if (!Array.isArray(raw.phones) || raw.phones.length > SUBMISSION_LIMITS.maxPhones) {
      return { ok: false, error: "invalid_phones" };
    }
    const cleaned: string[] = [];
    for (const p of raw.phones) {
      const phone = trimmedString(p, SUBMISSION_LIMITS.phone);
      if (p !== "" && phone) cleaned.push(phone);
    }
    phones = cleaned;
  }

  let location: LocationValue | null = null;
  if (raw.location !== undefined && raw.location !== null) {
    const loc = validateLocation(raw.location);
    if (!loc.ok) return { ok: false, error: loc.error };
    location = loc.value;
  }

  return {
    ok: true,
    value: {
      name,
      regionId,
      regionName,
      days,
      daysLabel,
      hoursText,
      referenceText,
      mapUrl,
      organizer,
      phones,
      location,
    },
  };
}

