import { prisma } from "@/server/db";
import { ok, withErrorHandling } from "@/server/http";
import { limitRequest } from "@/server/rate-limit";
import { READ_RATE_LIMIT, READ_RATE_WINDOW_MS } from "@/server/constants";

export const dynamic = "force-dynamic";

/**
 * Liveness + database reachability. Deliberately cheap: a `SELECT 1`, not a
 * table scan, so it can be polled by a load balancer without cost.
 */
export const GET = withErrorHandling(async (request: Request) => {
  limitRequest(request, "health", READ_RATE_LIMIT, READ_RATE_WINDOW_MS);

  const startedAt = Date.now();
  let database: "up" | "down" = "up";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("[health] database check failed:", error);
    database = "down";
  }

  return ok(
    {
      status: database === "up" ? "ok" : "degraded",
      database,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    undefined,
    { status: database === "up" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
});
