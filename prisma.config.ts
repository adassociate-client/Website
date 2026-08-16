// Prisma 7 configuration.
//
// Two things moved here from the old schema.prisma:
//   - the datasource URL (schemas no longer accept `url = env(...)`)
//   - the seed command (previously the `prisma.seed` key in package.json)
//
// Prisma 7 also stopped auto-loading .env, hence the explicit dotenv import.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
