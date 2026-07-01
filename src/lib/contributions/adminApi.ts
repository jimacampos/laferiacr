import type { ApiResult } from "./api";
import type { AuditEntry, QueueItem } from "./moderation";
import type { ConfigSetting } from "./settings";
import type { UserPage, UserSummary } from "./roleAdmin";

// Thin client-side fetch wrappers for the Phase 4 admin/moderation endpoints. Pure browser
// code — no server/prisma imports — safe to use from client components. Authorization is
// always enforced server-side; these helpers just call the routes and surface the result.

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init);
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

function post<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  return request<T>(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// --- Reports queue ---------------------------------------------------------

export function resolveReports(
  targetType: "market" | "proposal",
  targetId: string,
  decision: "resolve" | "dismiss",
  reason?: string,
): Promise<ApiResult<{ status: string; closed: number }>> {
  return post("/api/admin/reports", { targetType, targetId, decision, reason });
}

// --- Content moderation ----------------------------------------------------

export function removeProposal(
  proposalId: string,
  reason?: string,
): Promise<ApiResult<{ status: string }>> {
  return post(`/api/admin/proposals/${encodeURIComponent(proposalId)}`, {
    action: "remove",
    reason,
  });
}

export function moderateMarket(
  slug: string,
  body: Record<string, unknown>,
): Promise<ApiResult<{ status: string }>> {
  return post(`/api/admin/markets/${encodeURIComponent(slug)}`, body);
}

// --- Roles -----------------------------------------------------------------

export function listUsers(
  query: string,
  page = 1,
): Promise<ApiResult<UserPage>> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  params.set("page", String(page));
  return request(`/api/admin/users?${params.toString()}`);
}

export function changeRole(
  action: "grant" | "revoke",
  userId: string,
  role: string,
): Promise<ApiResult<{ status: string; changed: boolean }>> {
  return post("/api/admin/roles", { action, userId, role });
}

// --- Bans ------------------------------------------------------------------

export function banUser(
  userId: string,
  duration: string,
  reason?: string,
): Promise<ApiResult<{ status: string; banId: string; expiresAt: string | null }>> {
  return post("/api/admin/bans", { userId, duration, reason });
}

export function liftBan(banId: string): Promise<ApiResult<{ status: string }>> {
  return post(`/api/admin/bans/${encodeURIComponent(banId)}`, { action: "lift" });
}

// --- Settings --------------------------------------------------------------

export function setConfigValue(
  key: string,
  value: string,
): Promise<ApiResult<{ status: string; key: string; value: string }>> {
  return post("/api/admin/config", { key, value });
}

// --- Re-exported view types (for client components) ------------------------

export type { QueueItem, AuditEntry, ConfigSetting, UserSummary, UserPage };
