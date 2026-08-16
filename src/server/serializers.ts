import type {
  Category,
  ContactChannel,
  Enquiry,
  Product,
} from "@/generated/prisma/client";

/**
 * Database rows → API resources.
 *
 * This layer exists so a column rename never becomes a breaking API change,
 * and so fields that must not leave the server (Enquiry.ipHash, userAgent)
 * cannot leak by accident — they are dropped here, once, rather than in every
 * handler.
 */

const priceFormatters = new Map<string, Intl.NumberFormat>();

function formatPrice(cents: number, currency: string): string {
  let formatter = priceFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency });
    priceFormatters.set(currency, formatter);
  }
  return formatter.format(cents / 100);
}

export function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export interface ProductResource {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: {
    amountCents: number;
    currency: string;
    formatted: string;
    /** "per engagement", "per day", "from" — null when quoted on request. */
    unit: string | null;
  };
  imageUrl: string | null;
  tags: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  category: { slug: string; name: string } | null;
}

export function serializeProduct(
  product: Product & { category?: Category | null },
): ProductResource {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: {
      amountCents: product.priceCents,
      currency: product.currency,
      formatted: formatPrice(product.priceCents, product.currency),
      unit: product.priceUnit,
    },
    imageUrl: product.imageUrl,
    tags: parseTags(product.tags),
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
    category: product.category
      ? { slug: product.category.slug, name: product.category.name }
      : null,
  };
}

export interface CategoryResource {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
}

export function serializeCategory(
  category: Category & { _count?: { products: number } },
): CategoryResource {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    productCount: category._count?.products ?? 0,
  };
}

export interface EnquiryResource {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  source: string;
  product: { slug: string; name: string } | null;
  createdAt: string;
}

/** Note the omissions: ipHash and userAgent never appear in a response. */
export function serializeEnquiry(
  enquiry: Enquiry & { product?: Product | null },
): EnquiryResource {
  return {
    id: enquiry.id,
    reference: enquiry.reference,
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone,
    message: enquiry.message,
    status: enquiry.status,
    source: enquiry.source,
    product: enquiry.product
      ? { slug: enquiry.product.slug, name: enquiry.product.name }
      : null,
    createdAt: enquiry.createdAt.toISOString(),
  };
}

export interface ContactChannelResource {
  kind: string;
  label: string;
  value: string;
  href: string;
}

export function serializeContactChannel(channel: ContactChannel): ContactChannelResource {
  return {
    kind: channel.kind,
    label: channel.label,
    value: channel.value,
    href: channel.href,
  };
}
