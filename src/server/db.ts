import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma singleton.
 *
 * Prisma 7 requires an explicit driver adapter — there is no built-in engine
 * connection any more. Swapping to Postgres means replacing this adapter with
 * `@prisma/adapter-pg`; nothing else in the application changes.
 *
 * The globalThis stash exists because Next's dev server re-evaluates modules
 * on every edit. Without it each hot reload opens another SQLite handle until
 * the process runs out. Production evaluates the module once, so it is skipped.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing) return existing;

  const client = createClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/**
 * Constructed on first use, not on import.
 *
 * `next build` imports every route module to collect its page data, which
 * imported this file, which opened a database connection — so the build could
 * not run anywhere DATABASE_URL was absent. That is every CI runner and every
 * Vercel build, because .env is (correctly) gitignored, and it failed with
 * "Failed to collect page data for /api/products" rather than anything that
 * pointed at the real cause.
 *
 * A build has no business needing a live database. Deferring construction to
 * the first property access keeps the missing-variable error exactly where it
 * belongs: on the request that actually tries to query.
 *
 * The proxy binds methods to the real client because Prisma's delegates rely
 * on `this`; returning them unbound would break every call.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});
