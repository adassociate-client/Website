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

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
