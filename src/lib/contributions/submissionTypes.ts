// Client-safe shapes for community-submitted new markets (Phase 5). Kept free of prisma/server
// imports so client components (the pending queue, submission cards) can import the types.

import type { LocationValue } from "./types";

/** The non-name candidate fields carried in `market_submissions.details` (jsonb). */
export interface SubmissionDetails {
  regionId: string;
  regionName: string;
  days: string[];
  daysLabel: string;
  hoursText: string | null;
  referenceText: string | null;
  mapUrl: string | null;
  organizer: string | null;
  phones: string[];
}

/** A pending submission shaped for the browse/confirm UI. */
export interface PendingSubmission {
  id: string;
  name: string;
  regionName: string;
  days: string[];
  daysLabel: string;
  hoursText: string | null;
  referenceText: string | null;
  mapUrl: string | null;
  organizer: string | null;
  phones: string[];
  hasLocation: boolean;
  location: LocationValue | null;
  status: string;
  confirmCount: number;
  rejectCount: number;
  net: number;
  remaining: number;
  createdAt: string;
  /** The signed-in viewer authored this submission (cannot confirm it). */
  own: boolean;
  /** The viewer's existing vote on this submission, if any. */
  viewerVote: "confirm" | "reject" | null;
}
