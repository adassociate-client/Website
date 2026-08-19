import { ok, withErrorHandling } from "@/server/http";
import { limitRequest } from "@/server/rate-limit";
import { READ_RATE_LIMIT, READ_RATE_WINDOW_MS } from "@/server/constants";
import { contactChannelsForProduct, listContactChannels } from "@/server/services/contact";
import { slugSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/contact — phone, WhatsApp, Instagram and the rest.
 *
 * `?product=<slug>` deep-links WhatsApp to a message naming that item.
 */
export const GET = withErrorHandling(async (request: Request) => {
  limitRequest(request, "contact", READ_RATE_LIMIT, READ_RATE_WINDOW_MS);

  const { searchParams } = new URL(request.url);
  const productParam = searchParams.get("product");

  const channels = productParam
    ? await contactChannelsForProduct(slugSchema.parse(productParam))
    : await listContactChannels();

  return ok(channels, { total: channels.length }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
});
