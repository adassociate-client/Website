import { ok, withErrorHandling } from "@/server/http";
import { limitRequest } from "@/server/rate-limit";
import { READ_RATE_LIMIT, READ_RATE_WINDOW_MS } from "@/server/constants";
import { contactChannelsForProduct } from "@/server/services/contact";
import { getProductBySlug, getRelatedProducts } from "@/server/services/products";
import { slugSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/products/[slug]
 *
 * Returns the item, a few related ones, and the contact channels with WhatsApp
 * pre-filled to name this product — everything a detail page needs in one
 * round trip, so the "further enquiries" path is one tap from the item.
 */
export const GET = withErrorHandling(
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    limitRequest(request, "product", READ_RATE_LIMIT, READ_RATE_WINDOW_MS);

    const { slug: rawSlug } = await context.params;
    const slug = slugSchema.parse(rawSlug);

    // getProductBySlug throws 404 first, so the other two never run on a miss.
    const product = await getProductBySlug(slug);
    const [related, contact] = await Promise.all([
      getRelatedProducts(slug),
      contactChannelsForProduct(slug),
    ]);

    return ok({ product, related, contact }, undefined, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  },
);
