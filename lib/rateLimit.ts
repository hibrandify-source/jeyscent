// lib/rateLimit.ts
// In-memory sliding-window rate limiter. Each serverless function instance keeps
// its own map of (key → [timestamps]) and rejects requests that exceed `limit`
// inside `windowMs`. Good enough to raise the bar against brute-force / spam;
// for true multi-instance scale, swap this for an Upstash/Redis-backed limiter
// (the API surface below is intentionally small to make that swap trivial).

type Bucket = number[]; // timestamps of recent requests

const buckets = new Map<string, Bucket>();

// Periodically drop expired entries so the map doesn't grow without bound.
// Lazy cleanup also happens on every lookup, so this is just a backstop.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, hits] of buckets) {
      const live = hits.filter((t) => now - t < 60_000);
      if (live.length === 0) buckets.delete(key);
      else buckets.set(key, live);
    }
  }, 60_000).unref?.();
}

export interface RateLimitResult {
  ok: boolean;
  /** Number of requests allowed in the window. */
  limit: number;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Milliseconds until the oldest hit falls out of the window. */
  retryAfterMs: number;
}

/**
 * Check the rate limit for `key`. Returns `ok: false` if the limit has been
 * exceeded. The caller is responsible for returning a 429 to the client with
 * the `retryAfterMs` (rounded up to seconds) set as `Retry-After`.
 *
 * Example:
 *   const rl = rateLimit(`login:${ip}`, { limit: 10, windowMs: 60_000 });
 *   if (!rl.ok) return NextResponse.json({error:"Too many attempts"}, {
 *     status: 429,
 *     headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
 *   });
 */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? [];
  const live = bucket.filter((t) => now - t < opts.windowMs);

  if (live.length >= opts.limit) {
    const oldest = live[0] ?? now;
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      retryAfterMs: Math.max(1, opts.windowMs - (now - oldest)),
    };
  }

  live.push(now);
  buckets.set(key, live);

  return {
    ok: true,
    limit: opts.limit,
    remaining: Math.max(0, opts.limit - live.length),
    retryAfterMs: 0,
  };
}

/** Convenience: extract a stable client IP from a NextRequest for rate-limit keys. */
export function clientIp(request: { headers: Headers; ip?: string }): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.split(":")[0];
  }
  return (request.ip || "0.0.0.0").split(":")[0];
}

/**
 * Rate-limit-too-many helper that returns a 429 NextResponse, used by callers
 * to keep the boilerplate consistent.
 */
export function tooManyRequests(
  retryAfterMs: number,
  message = "Too many requests. Please slow down."
) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
      },
    }
  );
}

// Local import to avoid a circular dependency (NextResponse is only used by
// tooManyRequests above, which is only invoked from route handlers).
import { NextResponse } from "next/server";
