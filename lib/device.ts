// lib/device.ts
// Shared device-identity helpers for the watch + stream routes. The watch
// route performs the authoritative device binding; stream routes re-check the
// normalized UA so a stolen session cookie can't be used from another device.

import type { NextRequest } from "next/server";

/**
 * IP source: `x-forwarded-for` first entry (Vercel passes it through), falling
 * back to `request.ip`. Stripped of port. Used for logging/tracking only —
 * the User-Agent is the sole device identity.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.split(":")[0];
  }
  const directIp = (request as unknown as { ip?: string }).ip;
  if (directIp) return directIp.split(":")[0];
  return "0.0.0.0";
}

/**
 * Normalize a UA for the purposes of "same device?" comparison. We strip the
 * fine-grained version tokens (e.g. "Chrome/124.0.6367.91" -> "Chrome") so a
 * same-browser minor update doesn't trip the lock, while keeping the
 * identifying parts (browser family + OS family + device family + build).
 */
export function normalizeUa(raw: string): string {
  return raw
    // Collapse Chrome/Edge/Firefox/Safari version tokens
    .replace(/(Chrome|Edge|Edg|Firefox|Safari|Version|OPR|Opera|CriOS|FxiOS)\/[\d.]+/g, "$1")
    // Collapse mobile-version tokens
    .replace(/Mobile\/[\dA-F]+/g, "Mobile")
    // Trim runs of whitespace left behind
    .replace(/\s+/g, " ")
    .trim();
}