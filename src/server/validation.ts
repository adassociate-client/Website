import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_OFFSET,
  MAX_PAGE_SIZE,
  PRODUCT_SORTS,
} from "./constants";

/** Query-string booleans arrive as "true"/"1"/"false"/"0" or absent. */
const queryBool = z
  .union([z.literal("true"), z.literal("1"), z.literal("false"), z.literal("0")])
  .transform((v) => v === "true" || v === "1")
  .optional();

export const productQuerySchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  /** Free-text search across name and description. */
  q: z.string().trim().min(1).max(120).optional(),
  featured: queryBool,
  /** Defaults to true in the service — visitors should not see sold-out items. */
  available: queryBool,
  sort: z.enum(PRODUCT_SORTS).default("order"),
  limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  /**
   * Capped, not merely non-negative. SQLite answers a large OFFSET by
   * walking and discarding every preceding row, so an uncapped value is a
   * full table scan that costs the caller nothing to request.
   */
  offset: z.coerce.number().int().min(0).max(MAX_OFFSET).default(0),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens");

/**
 * Contact form payload.
 *
 * `website` is a honeypot: a real browser leaves the hidden field empty, most
 * naive bots fill every input they find. Rejecting a filled honeypot costs
 * nothing and stops a meaningful share of spam without a CAPTCHA.
 */
export const enquiryInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email("A valid email address is required").max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+()\d\s-]*$/, "Phone may contain digits, spaces and + ( ) - only")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be 2000 characters or fewer"),
  /** Slug of the item the visitor was viewing, if any. */
  productSlug: slugSchema.optional(),
  /**
   * Accepted by the schema on purpose. Rejecting it here would return a 422
   * naming the honeypot field, which tells a bot exactly what tripped it and
   * teaches it to leave the field alone next time. The handler inspects this
   * after validation and answers 202 as though the message were received.
   */
  website: z.string().max(500).optional(),
});

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

/** Turns URLSearchParams into the plain object Zod expects. */
export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of params) {
    if (value !== "") out[key] = value;
  }
  return out;
}
