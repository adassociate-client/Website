import { clientIp, hashIp } from "@/server/client";
import { ApiError, ok, readJson, withErrorHandling } from "@/server/http";
import { consume } from "@/server/rate-limit";
import { createEnquiry } from "@/server/services/enquiries";
import { enquiryInputSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

const RATE_LIMIT = Number(process.env.ENQUIRY_RATE_LIMIT ?? 5);
const RATE_WINDOW_MS = Number(process.env.ENQUIRY_RATE_WINDOW_MS ?? 600_000);

/**
 * POST /api/enquiries — the in-built contact form.
 *
 * Body: { name, email, phone?, message, productSlug?, website? }
 * `website` is the honeypot and must be absent or empty.
 *
 * Order matters: rate limit before parsing, so a flood costs a map lookup
 * rather than a JSON parse and a database round trip.
 */
export const POST = withErrorHandling(async (request: Request) => {
  const ip = clientIp(request);
  const ipHash = hashIp(ip);

  consume(`enquiry:${ipHash}`, RATE_LIMIT, RATE_WINDOW_MS);

  const body = await readJson(request);
  const input = enquiryInputSchema.parse(body);

  // Honeypot: a filled hidden field means a bot. Answer 202 rather than an
  // error — telling a scraper it was detected just teaches it to adapt, and a
  // real user can never reach this branch.
  if (input.website) {
    return ok(
      { received: true },
      undefined,
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  const enquiry = await createEnquiry(input, {
    ipHash,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return ok(
    {
      reference: enquiry.reference,
      name: enquiry.name,
      email: enquiry.email,
      product: enquiry.product,
      createdAt: enquiry.createdAt,
      message: "Thanks for getting in touch. We will be back to you shortly.",
    },
    undefined,
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
});

/**
 * Reading the inbox is a staff action and this build has no authentication,
 * so the collection is closed rather than left open by omission. Wire an admin
 * session here when you add one.
 */
export const GET = withErrorHandling(async () => {
  throw new ApiError("not_found", "Enquiries are not publicly readable");
});
