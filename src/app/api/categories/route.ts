import { ok, withErrorHandling } from "@/server/http";
import { listCategories } from "@/server/services/products";

export const dynamic = "force-dynamic";

/** GET /api/categories — active menu sections with their available-item counts. */
export const GET = withErrorHandling(async () => {
  const categories = await listCategories();

  return ok(categories, { total: categories.length }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
});
