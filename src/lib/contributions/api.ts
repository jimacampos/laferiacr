import type { LocationValue } from "./types";

// Thin client-side fetch wrappers for the contribution endpoints. Pure browser code — no
// server/prisma imports — safe to use from client components. CAPTCHA token is included when
// the widget is enabled; it is ignored server-side while CAPTCHA is off (dev).

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function postJson<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data: unknown = undefined;
    try {
      data = await res.json();
    } catch {
      // no/invalid JSON body
    }
    const error =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : undefined;
    return { ok: res.ok, status: res.status, data: data as T, error };
  } catch {
    return { ok: false, status: 0, error: "network_error" };
  }
}

export function submitProposal(
  slug: string,
  field: "hours" | "location",
  value: string | LocationValue,
  captchaToken?: string,
): Promise<ApiResult<{ id: string; status: string }>> {
  return postJson(`/api/markets/${encodeURIComponent(slug)}/proposals`, {
    field,
    value,
    captchaToken,
  });
}

export function voteProposal(
  proposalId: string,
  vote: "confirm" | "reject",
): Promise<ApiResult<{ status: string; promoted: boolean }>> {
  return postJson(`/api/proposals/${encodeURIComponent(proposalId)}/${vote}`);
}

export function submitReport(
  targetType: "market" | "proposal" | "submission",
  targetId: string,
  reason?: string,
  captchaToken?: string,
): Promise<ApiResult> {
  return postJson(`/api/reports`, { targetType, targetId, reason, captchaToken });
}

/** Payload for creating a new-market submission (Phase 5). */
export interface SubmissionInput {
  name: string;
  regionId: string;
  regionName: string;
  days: string[];
  daysLabel?: string;
  hoursText?: string | null;
  referenceText?: string | null;
  mapUrl?: string | null;
  organizer?: string | null;
  phones?: string[];
  location?: LocationValue | null;
  captchaToken?: string;
}

/** A likely-duplicate market returned by the create/check endpoints (soft warning). */
export interface DuplicateCandidate {
  slug: string;
  name: string;
  regionName: string | null;
  nameScore: number;
  distanceMeters: number | null;
}

export function submitMarketSubmission(
  input: SubmissionInput,
): Promise<ApiResult<{ id: string; duplicates: DuplicateCandidate[] }>> {
  return postJson(`/api/market-submissions`, input);
}

export function voteSubmission(
  submissionId: string,
  vote: "confirm" | "reject",
): Promise<
  ApiResult<{ status: string; promoted: boolean; marketSlug: string | null }>
> {
  return postJson(
    `/api/market-submissions/${encodeURIComponent(submissionId)}/${vote}`,
  );
}

/** Live soft-duplicate check for the new-market form (GET; never blocks). */
export async function checkDuplicates(
  name: string,
  location?: LocationValue | null,
): Promise<DuplicateCandidate[]> {
  const params = new URLSearchParams({ name });
  if (location) {
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
  }
  try {
    const res = await fetch(`/api/market-submissions/duplicates?${params}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { duplicates?: DuplicateCandidate[] };
    return data.duplicates ?? [];
  } catch {
    return [];
  }
}

export function submitFeedback(
  message: string,
  pageUrl?: string,
): Promise<ApiResult<{ status: string }>> {
  return postJson(`/api/feedback`, { message, pageUrl });
}
