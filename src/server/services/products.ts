import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { notFound } from "../http";
import { serializeCategory, serializeProduct } from "../serializers";
import type { ProductQuery } from "../validation";

/**
 * Catalogue reads. All query building lives here so the route handlers stay
 * thin and the same logic can be reused by server components without going
 * back out over HTTP.
 */

const ORDER_BY: Record<ProductQuery["sort"], Prisma.ProductOrderByWithRelationInput[]> = {
  order: [{ sortOrder: "asc" }, { name: "asc" }],
  price_asc: [{ priceCents: "asc" }, { name: "asc" }],
  price_desc: [{ priceCents: "desc" }, { name: "asc" }],
  name: [{ name: "asc" }],
  newest: [{ createdAt: "desc" }],
};

export async function listProducts(query: ProductQuery) {
  const where: Prisma.ProductWhereInput = {
    // Default to in-stock only; `?available=false` is an explicit opt-in used
    // by staff tooling, not something a visitor stumbles into.
    isAvailable: query.available ?? true,
    ...(query.featured !== undefined ? { isFeatured: query.featured } : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { description: { contains: query.q } },
          ],
        }
      : {}),
  };

  // One round trip for the page, one for the count — the count is what makes
  // `hasMore` honest rather than guessed from a short page.
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: ORDER_BY[query.sort],
      take: query.limit,
      skip: query.offset,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map(serializeProduct),
    meta: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + rows.length < total,
    },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product) throw notFound(`Product "${slug}"`);
  return serializeProduct(product);
}

/** Other available items in the same category, for a "you might also like" rail. */
export async function getRelatedProducts(slug: string, limit = 4) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true },
  });

  if (!product) throw notFound(`Product "${slug}"`);

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isAvailable: true,
    },
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    take: limit,
  });

  return related.map(serializeProduct);
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: { where: { isAvailable: true } } } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map(serializeCategory);
}
