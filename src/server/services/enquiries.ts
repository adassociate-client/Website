import { randomInt } from "node:crypto";
import { prisma } from "../db";
import { ApiError } from "../http";
import { serializeEnquiry } from "../serializers";
import type { EnquiryInput } from "../validation";

/**
 * Contact-form writes.
 *
 * Kept deliberately small: validate, resolve the optional product, persist,
 * hand back a reference the visitor can quote. Delivery (email/WhatsApp
 * notification to the owner) is a separate concern — see notifyOwner below.
 */

// No I, O, 0 or 1 — references get read aloud over the phone.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

export interface CreateEnquiryContext {
  ipHash?: string;
  userAgent?: string;
}

export async function createEnquiry(input: EnquiryInput, context: CreateEnquiryContext) {
  let productId: string | null = null;

  if (input.productSlug) {
    const product = await prisma.product.findUnique({
      where: { slug: input.productSlug },
      select: { id: true },
    });

    // A stale link should not lose the message — record it unattached rather
    // than rejecting a visitor's genuine enquiry.
    productId = product?.id ?? null;
  }

  // `reference` is unique, so a collision is a write conflict rather than a
  // silent overwrite. Three attempts is ample for a 32^6 space.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const enquiry = await prisma.enquiry.create({
        data: {
          reference: `ADA-${randomCode()}`,
          name: input.name,
          email: input.email,
          phone: input.phone?.trim() || null,
          message: input.message,
          productId,
          source: "form",
          status: "new",
          ipHash: context.ipHash,
          userAgent: context.userAgent?.slice(0, 400),
        },
        include: { product: true },
      });

      return serializeEnquiry(enquiry);
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 2) continue;
      throw error;
    }
  }

  throw new ApiError("conflict", "Could not allocate an enquiry reference");
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

export async function getEnquiryByReference(reference: string) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { reference },
    include: { product: true },
  });

  return enquiry ? serializeEnquiry(enquiry) : null;
}
