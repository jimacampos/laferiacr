import {
  CR_BOUNDS,
  HOURS_MAX_LENGTH,
  PROPOSAL_FIELDS,
  type ProposalField,
} from "./config";
import type { LocationValue } from "./types";

export type { LocationValue };

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
