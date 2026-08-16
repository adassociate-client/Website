import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Quick read-only look at what is actually stored. Useful for confirming a
 * form submission landed, and for checking that discarded spam did not.
 *
 *   npx tsx scripts/inspect-db.ts
 */
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

async function main() {
  const [categories, products, channels, enquiries] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.contactChannel.count(),
    prisma.enquiry.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  console.log(`categories: ${categories}`);
  console.log(`products:   ${products}`);
  console.log(`channels:   ${channels}`);
  console.log(`enquiries:  ${enquiries.length}\n`);

  for (const e of enquiries) {
    console.log(`  ${e.reference}  ${e.status.padEnd(8)} ${e.name} <${e.email}>`);
    console.log(`    product : ${e.product?.name ?? "(none)"}`);
    console.log(`    message : ${e.message.slice(0, 70)}`);
    console.log(`    ipHash  : ${e.ipHash ? `${e.ipHash.slice(0, 16)}… (stored hashed)` : "(none)"}`);
  }

  const spam = enquiries.filter((e) => e.email.includes("spam"));
  console.log(`\nhoneypot submissions persisted: ${spam.length} (expected 0)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
