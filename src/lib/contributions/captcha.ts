import { captchaEnabled } from "./config";

// Provider-agnostic CAPTCHA verification seam (ADR-0012). The whole check is gated by
// CAPTCHA_ENABLED so dev stays frictionless until real keys are provisioned; when enabled
// it verifies a client-issued token against the provider's siteverify endpoint. The first
// adapter targets Cloudflare Turnstile, but the shape is provider-neutral.

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify an anonymous submission's CAPTCHA token. Returns true when verification is
 * disabled (dev) or succeeds; false when enabled and the token is missing/invalid.
 */
export async function verifyCaptcha(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<boolean> {
  if (!captchaEnabled()) return true;

  const secret = process.env.CAPTCHA_SECRET;
  if (!secret) {
    // Enabled but misconfigured — fail closed so we don't silently accept unverified writes.
    return false;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
