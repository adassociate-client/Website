import { ApiError } from "./http";

/**
 * Fixed-window rate limiter, in process memory.
 *
 * LIMITATION, stated plainly: this counts per Node process. It is correct for
 * a single instance (which is how this app runs today) and becomes leaky the
 * moment you scale horizontally or deploy to serverless, where each instance
 * keeps its own counters. Swap the `hits` map for Redis/Upstash at that point —
 * the `consume` signature is designed not to change.
 */

interface Window {
  count: number;
  resetAt: number;
}

const hits = new Map<string, Window>();

/** Drops expired windows so the map cannot grow without bound. */
function sweep(now: number) {
  for (const [key, window] of hits) {
    if (window.resetAt <= now) hits.delete(key);
  }
}

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

export interface RateLimitResult {
  remaining: number;
  resetAt: number;
}

/**
 * Records one hit against `key`. Throws a 429 ApiError carrying Retry-After
 * and the standard RateLimit-* headers once the limit is exceeded.
 */
export function consume(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    sweep(now);
    lastSweep = now;
  }

  const existing = hits.get(key);
  const window =
    existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

  window.count += 1;
  hits.set(key, window);

  const remaining = Math.max(0, limit - window.count);

  if (window.count > limit) {
    const retryAfter = Math.ceil((window.resetAt - now) / 1000);
    throw new ApiError(
      "rate_limited",
      `Too many requests. Try again in ${retryAfter}s.`,
      undefined,
      {
        "Retry-After": String(retryAfter),
        "RateLimit-Limit": String(limit),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(retryAfter),
      },
    );
  }

  return { remaining, resetAt: window.resetAt };
}

/** Test seam — lets a suite start from a clean slate. */
export function resetRateLimits() {
  hits.clear();
}
