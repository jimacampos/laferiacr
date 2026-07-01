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
  targetType: "market" | "proposal",
  targetId: string,
  reason?: string,
  captchaToken?: string,
): Promise<ApiResult> {
  return postJson(`/api/reports`, { targetType, targetId, reason, captchaToken });
}
