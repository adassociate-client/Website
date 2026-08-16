import { createHash } from "node:crypto";

/**
 * Best-effort client IP.
 *
 * Behind a proxy (Vercel, nginx, Cloudflare) the socket address is the proxy's,
 * so the forwarded headers are the only signal available. They are also
 * trivially spoofable by a direct caller — which is why this is used for rate
 * limiting and abuse triage only, never for authorisation.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Left-most entry is the original client; the rest are proxy hops.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Salted SHA-256 of an IP. Stored instead of the address itself so the
 * enquiries table holds no plaintext identifiers, while still allowing
 * "same sender?" comparisons.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";

  if (!salt && process.env.NODE_ENV === "production") {
    // Hashing without a salt is reversible by rainbow table for a 32-bit space.
    throw new Error("IP_HASH_SALT must be set in production");
  }

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
