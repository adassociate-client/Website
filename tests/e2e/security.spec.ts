import { test, expect } from "@playwright/test";

/**
 * The hardening in next.config.ts and src/server, asserted rather than assumed.
 *
 * The API cases run on one project only and in order: the rate limiter lives
 * in the server's process memory, so five browser projects firing the same
 * flood in parallel would exhaust each other's budget and the failures would
 * be about the test, not the code.
 */

test("security headers are present on the document", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  // The version banner is free reconnaissance.
  expect(headers["x-powered-by"]).toBeUndefined();

  const csp = headers["content-security-policy"];
  expect(csp, "no CSP served").toBeTruthy();
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("base-uri 'self'");
  expect(csp).toContain("form-action 'self'");
});

test("the page loads with no CSP violations", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  const failed: string[] = [];
  page.on("requestfailed", (r) => failed.push(`${r.url()} :: ${r.failure()?.errorText}`));

  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2500);

  // A policy that blocks the site's own assets is worse than none, so this
  // guards the CSP against being tightened into breaking the page.
  expect(violations, "the CSP is blocking the page's own resources").toEqual([]);
  expect(failed, "requests the browser refused").toEqual([]);
});

test("API responses are never held by a shared cache", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test.describe("API hardening", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(({ browserName }) => browserName !== "chromium", "transport-level, not browser-dependent");

  test("rejects a body over the 64KB cap", async ({ request }) => {
    const oversized = { name: "Flood", email: "a@b.co", message: "x".repeat(300_000) };
    const response = await request.post("/api/enquiries", { data: oversized });
    expect(response.status()).toBe(413);
    expect((await response.json()).error.code).toBe("payload_too_large");
  });

  test("caps pagination", async ({ request }) => {
    // A large OFFSET is a full table walk in SQLite that costs the caller nothing.
    expect((await request.get("/api/products?offset=999999999")).status()).toBe(422);
    expect((await request.get("/api/products?limit=999999")).status()).toBe(422);
    expect((await request.get("/api/products?offset=10000")).status()).toBe(200);
  });

  test("refuses malformed slugs and parameterises search", async ({ request }) => {
    expect((await request.get("/api/products/..%2F..%2Fetc%2Fpasswd")).status()).toBe(422);
    expect((await request.get("/api/products/%3Cscript%3E")).status()).toBe(422);
    // Prisma parameterises, so this is an ordinary search that finds nothing.
    expect((await request.get("/api/products?q=%27%20OR%201%3D1--")).status()).toBe(200);
  });

  test("rejects malformed JSON without leaking internals", async ({ request }) => {
    const response = await request.post("/api/enquiries", {
      headers: { "content-type": "application/json" },
      // Buffer, not a string: Playwright JSON-encodes a string body, which
      // would arrive as the valid JSON document "{nope" and be rejected by the
      // schema at 422 rather than by the parser at 400.
      data: Buffer.from("{nope"),
    });
    expect(response.status()).toBe(400);
    const body = await response.text();
    expect(body).not.toMatch(/at .*\(.*:\d+:\d+\)/); // no stack trace
  });

  test("the enquiry inbox is closed", async ({ request }) => {
    expect((await request.get("/api/enquiries")).status()).toBe(404);
  });

  // Last: this spends the read budget for the window.
  test("rate limits read endpoints", async ({ request }) => {
    let limitedAt = 0;
    for (let i = 1; i <= 140; i += 1) {
      const response = await request.get("/api/categories");
      if (response.status() === 429) {
        limitedAt = i;
        expect(response.headers()["retry-after"], "429 without Retry-After").toBeTruthy();
        break;
      }
    }
    expect(limitedAt, "read endpoints were never rate limited").toBeGreaterThan(0);
  });
});
