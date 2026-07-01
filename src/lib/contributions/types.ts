// Shared, dependency-free types for the contribution loop. Safe to import from client
// components (no prisma/server imports here).

/** A location proposal payload: WGS84 lat/lng. */
export interface LocationValue {
  lat: number;
  lng: number;
}

/** A pending alternative shown in the conflict view ("2 say 5am, 1 says 6am"). */
export interface PendingProposal {
  id: string;
  /** Display payload: string for hours, { lat, lng } for location. */
  value: string | LocationValue;
  confirmCount: number;
  rejectCount: number;
  /** Net confirmations (confirm − reject). */
  net: number;
  /** Confirmations still needed to auto-promote at the current threshold. */
  remaining: number;
  createdAt: string;
  /** The signed-in viewer authored this proposal (cannot confirm it). */
  own: boolean;
  /** The viewer's existing vote on this proposal, if any. */
  viewerVote: "confirm" | "reject" | null;
}

/** Trust state for one contributable field (hours or location). */
export interface FieldContributionState {
  /** The current market value was promoted from a community proposal. */
  verified: boolean;
  /** When the current value was last promoted (ISO), if verified. */
  verifiedAt: string | null;
  /** Confirmations on the verifying proposal. */
  verifiedConfirmCount: number | null;
  /** Open proposals awaiting confirmation, most-confirmed first. */
  pending: PendingProposal[];
}

export interface MarketContributions {
  hours: FieldContributionState;
  location: FieldContributionState;
}
