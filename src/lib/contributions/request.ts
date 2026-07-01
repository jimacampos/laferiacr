import { createHash } from "node:crypto";

/**
 * Best-effort client IP from proxy headers (Container Apps / Front Door terminate TLS and
 * forward the original client IP). Falls back to "unknown" so rate limiting still buckets
 * requests without a header rather than throwing.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * One-way hash of the client IP for abuse accounting. We never store raw IPs
 * (security-privacy: IP is operational, short-retention). Salted with AUTH_SECRET when
 * available so hashes are not trivially reversible via a rainbow table.
 */
export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET ?? "laferia";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Convenience: hashed client IP for a request. */
export function clientIpHash(request: Request): string {
  return hashIp(clientIp(request));
}
