// Maps a confirm/reject API error code to an i18n key so the reporter sees a specific reason
// instead of a single generic failure message (BL-022). Pure browser-safe logic — no server
// imports — so it can be unit-tested and used from the client ProposalList component.

const VOTE_ERROR_KEYS: Record<string, string> = {
  auth_required: "proposals.error.signIn",
  banned: "proposals.error.banned",
  not_found: "proposals.error.notFound",
  not_open: "proposals.error.notOpen",
  self_vote: "proposals.error.selfVote",
  network_error: "proposals.error.network",
  unavailable: "proposals.error.network",
};

/**
 * Resolve the i18n key for a vote failure. Known error codes map to a specific message;
 * anything unknown (or missing) falls back to the shared generic error string.
 */
export function voteErrorKey(error?: string): string {
  if (error && error in VOTE_ERROR_KEYS) return VOTE_ERROR_KEYS[error];
  return "contribute.error";
}
