import { ok, withErrorHandling } from "@/server/http";
import { limitRequest } from "@/server/rate-limit";
import { READ_RATE_LIMIT, READ_RATE_WINDOW_MS } from "@/server/constants";
import { listProducts } from "@/server/services/products";
import { productQuerySchema, searchParamsToObject } from "@/server/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/products
 *
 * Query: category, q, featured, available, sort, limit, offset
 *   ?category=transactions&sort=price_asc&limit=12
 *   ?q=diligence
 *   ?featured=true
 *
 * Unknown params are ignored; malformed ones return 422 with the offending
 * field named, rather than being silently coerced.
 */
export const GET = withErrorHandling(async (request: Request) => {
  limitRequest(request, "products", READ_RATE_LIMIT, READ_RATE_WINDOW_MS);

  const { searchParams } = new URL(request.url);
  const query = productQuerySchema.parse(searchParamsToObject(searchParams));

  const { products, meta } = await listProducts(query);

  return ok(products, meta, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
});
