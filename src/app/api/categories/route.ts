import { ok, withErrorHandling } from "@/server/http";
import { limitRequest } from "@/server/rate-limit";
import { READ_RATE_LIMIT, READ_RATE_WINDOW_MS } from "@/server/constants";
import { listCategories } from "@/server/services/products";

export const dynamic = "force-dynamic";

/** GET /api/categories — active menu sections with their available-item counts. */
export const GET = withErrorHandling(async (request: Request) => {
  limitRequest(request, "categories", READ_RATE_LIMIT, READ_RATE_WINDOW_MS);

  const categories = await listCategories();

  return ok(categories, { total: categories.length }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
});
