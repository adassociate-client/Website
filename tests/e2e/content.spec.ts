import { test, expect } from "@playwright/test";

/** Contact details are the site's product; a typo here is a lost enquiry. */

test("phone, email and WhatsApp links are well formed", async ({ page }) => {
  await page.goto("/");

  const tels = await page.locator("a[href^='tel:']").evaluateAll((els) =>
    els.map((e) => e.getAttribute("href")!),
  );
  expect(tels.length).toBeGreaterThan(0);
  for (const href of tels) {
    // E.164: a leading + and digits only, or the dialler mangles it.
    expect(href, `malformed tel: ${href}`).toMatch(/^tel:\+\d{8,15}$/);
  }

  const mailtos = await page.locator("a[href^='mailto:']").evaluateAll((els) =>
    els.map((e) => e.getAttribute("href")!),
  );
  expect(mailtos.length).toBeGreaterThan(0);
  for (const href of mailtos) {
    expect(href).toMatch(/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}/i);
  }

  const waLinks = await page.locator("a[href*='wa.me']").evaluateAll((els) =>
    els.map((e) => e.getAttribute("href")!),
  );
  for (const href of waLinks) {
    // wa.me wants the number without the +; a stray one silently 404s.
    expect(href, `malformed wa.me link: ${href}`).toMatch(/^https:\/\/wa\.me\/\d{8,15}\?text=/);
  }
});

test("external links cannot reach back through window.opener", async ({ page }) => {
  await page.goto("/");
  const unsafe = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>("a[target='_blank']")]
      .filter((a) => !(a.getAttribute("rel") ?? "").includes("noopener"))
      .map((a) => a.href),
  );
  expect(unsafe, "target=_blank without rel=noopener").toEqual([]);
});

test("the WhatsApp chooser opens and offers every number", async ({ page }) => {
  await page.goto("/");
  const details = page.locator(".ad-whatsapp");
  await details.locator("summary").click();

  const options = details.locator(".ad-whatsapp__option");
  await expect(options).toHaveCount(2);
  for (const href of await options.evaluateAll((els) => els.map((e) => e.getAttribute("href")!))) {
    expect(href).toContain("wa.me/");
  }
});

test("the document has a title, description and favicon", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.{10,}/);
  const description = await page.locator("meta[name='description']").getAttribute("content");
  expect(description?.length ?? 0).toBeGreaterThan(50);
  await expect(page.locator("link[rel='icon']")).toHaveCount(1);
});

test("robots.txt excludes the API", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("Disallow: /api/");
});
