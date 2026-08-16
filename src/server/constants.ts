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

/** Pagination guards — an unbounded `limit` is a denial-of-service vector. */
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

export const PRODUCT_SORTS = ["order", "price_asc", "price_desc", "name", "newest"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
