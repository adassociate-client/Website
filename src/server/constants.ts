/**
 * Values that would be database enums under Postgres. SQLite has no enum
 * type, so they live here and are enforced by Zod at the edge.
 */

export const ENQUIRY_STATUSES = ["new", "read", "replied", "archived"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** Where an enquiry came from. `form` is the only one the API writes today. */
export const ENQUIRY_SOURCES = ["form", "whatsapp", "phone", "instagram"] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

export const CONTACT_KINDS = [
  "phone",
  "whatsapp",
  "instagram",
  "linkedin",
  "email",
] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

/**
 * Deepest page we will serve. SQLite answers OFFSET by counting and
 * discarding every preceding row, so ?offset=9999999 is a full table walk
 * per request — cheap to send, expensive to answer.
 */
export const MAX_OFFSET = 10_000;

/**
 * Largest request body accepted, in bytes. Applies before JSON parsing, so
 * an oversized payload is dropped mid-stream rather than buffered whole.
 * The enquiry schema caps `message` at 2000 characters; 64KB is generous.
 */
export const MAX_BODY_BYTES = 64 * 1024;

/**
 * Ceiling on distinct rate-limit buckets held in memory. The key is derived
 * from a client-supplied header, so without a cap an attacker rotating
 * X-Forwarded-For allocates a map entry per request.
 */
export const MAX_RATE_LIMIT_KEYS = 50_000;

/** Per-IP budget for read endpoints, and the window it applies over. */
export const READ_RATE_LIMIT = Number(process.env.READ_RATE_LIMIT ?? 120);
export const READ_RATE_WINDOW_MS = Number(process.env.READ_RATE_WINDOW_MS ?? 60_000);

/** Pagination guards — an unbounded `limit` is a denial-of-service vector. */
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

export const PRODUCT_SORTS = ["order", "price_asc", "price_desc", "name", "newest"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
