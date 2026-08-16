// Prisma 7 configuration.
//
// Two things moved here from the old schema.prisma:
//   - the datasource URL (schemas no longer accept `url = env(...)`)
//   - the seed command (previously the `prisma.seed` key in package.json)
//
// Prisma 7 also stopped auto-loading .env, hence the explicit dotenv import.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // `env("DATABASE_URL")` was strict: it throws PrismaConfigEnvError when the
    // variable is missing, which killed `prisma generate` — and so the whole
    // `npm run build` — on any machine without a .env. That is every CI runner
    // and every Vercel build, since .env is correctly gitignored.
    //
    // `generate` only reads the URL to learn the provider; it never connects.
    // So a default is safe here, and nothing is silently weakened: db.ts still
    // throws at runtime if DATABASE_URL is genuinely unset, which is where a
    // missing connection string actually matters.
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
