import { ApiError } from "./http";
import { clientIp, rateLimitKey } from "./client";
import { MAX_RATE_LIMIT_KEYS } from "./constants";

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

  // The key derives from a client-supplied header, so an attacker rotating
  // X-Forwarded-For would otherwise allocate one map entry per request and
  // grow this map until the process dies. Past the cap, sweep early; if that
  // frees nothing, every window is still live and the load is real, so shed
  // rather than allocate.
  if (!hits.has(key) && hits.size >= MAX_RATE_LIMIT_KEYS) {
    sweep(now);
    if (hits.size >= MAX_RATE_LIMIT_KEYS) {
      throw new ApiError(
        "rate_limited",
        "Server is shedding load. Try again shortly.",
        undefined,
        { "Retry-After": "60" },
      );
    }
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

/**
 * Applies a per-client budget to a route.
 *
 * Previously only POST /api/enquiries was limited, which left every read
 * endpoint open — and those are the expensive ones: `?q=` runs an unindexed
 * LIKE across the catalogue on each call.
 *
 * The client key is a hashed IP taken from forwarded headers, which a direct
 * caller can spoof. That is why this is a cost control and not a security
 * boundary: it raises the price of casual abuse, while `consume` caps total
 * bucket count so spoofing cannot exhaust memory either. A shared store
 * (Redis/Upstash) is what makes this authoritative across instances.
 */
export function limitRequest(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return consume(`${scope}:${rateLimitKey(clientIp(request))}`, limit, windowMs);
}
