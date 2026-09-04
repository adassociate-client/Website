import { test, expect, type Page } from "@playwright/test";

/**
 * Layout integrity across the size range the site claims to support.
 *
 * Every assertion here corresponds to a defect that was actually present at
 * some point: the page scrolling sideways on a watch, tap targets under the
 * 24px floor, and — the one that made the site unusable — a nav that vanished
 * below 768px with nothing in its place.
 */

const SIZES = [
  { name: "watch", width: 240, height: 280 },
  { name: "phone-small", width: 320, height: 568 },
  { name: "phone", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "projector-xga", width: 1024, height: 768 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 },
  { name: "ultrawide", width: 2560, height: 1440 },
];

/**
 * Brings every revealable block through the viewport so lazy images load and
 * the IntersectionObserver fires for all of them.
 *
 * Each element is centred rather than the page being scrolled in fixed jumps.
 * Jumping past an element faster than the observer delivered its callback left
 * it stuck at opacity 0, and whichever engine lost that race failed the test —
 * Firefox on one run, Chromium on the next. Centring guarantees the element
 * clears the 15% threshold, so the outcome is the same every time.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    for (const el of document.querySelectorAll(".ad-observe")) {
      el.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 200));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
}

for (const size of SIZES) {
  test(`${size.name} (${size.width}x${size.height}) lays out without overflow`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto("/");
    await settle(page);

    // The page must never scroll sideways.
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offenders: [...document.querySelectorAll("body *")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (!r.width && !r.height) return false;
          if (getComputedStyle(el).position === "fixed") return false;
          if (r.left < -1000) return false; // the skip link parks offscreen
          return r.right > document.documentElement.clientWidth + 1 || r.left < -1;
        })
        .slice(0, 5)
        .map((el) => `${el.tagName}.${el.className || "-"}`),
    }));

    expect(overflow.offenders, `elements past the right edge`).toEqual([]);
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
}

test("every section is reachable and revealed on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await settle(page);

  // .ad-observe holds sections at opacity 0 until the observer fires; if that
  // ever regresses the page is blank below the hero.
  const unrevealed = await page.evaluate(
    () => [...document.querySelectorAll(".ad-observe")].filter((e) => getComputedStyle(e).opacity !== "1").length,
  );
  expect(unrevealed, "sections still hidden by the scroll reveal").toBe(0);

  for (const id of ["home", "about", "products", "work", "contact"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test("navigation is reachable below 768px and every anchor resolves", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const toggle = page.locator(".ad-nav__toggle");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".ad-nav__links")).toBeVisible();

  // Escape closes it and returns focus, or a keyboard user is stranded.
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();

  const dangling = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>(".ad-nav a[href^='#']")]
      .map((a) => a.getAttribute("href")!)
      .filter((href) => !document.getElementById(href.slice(1))),
  );
  expect(dangling, "nav links pointing at sections that do not exist").toEqual([]);
});

test("tap targets meet the 24px floor on touch devices", async ({ page, isMobile }) => {
  test.skip(!isMobile, "only meaningful where the pointer is coarse");
  await page.goto("/");
  await settle(page);

  const small = await page.evaluate(() =>
    [...document.querySelectorAll("a[href], button")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.left < -1000) return false;
        if (el.closest("p")) return false; // WCAG exempts links inside prose
        return r.height < 24 || r.width < 24;
      })
      .map((el) => `${el.tagName} "${(el.textContent || "").trim().slice(0, 20)}"`),
  );
  expect(small, "controls below the minimum target size").toEqual([]);
});

test("anchored sections clear the sticky header", async ({ page }) => {
  await page.goto("/");

  // Below 768px the links live inside the collapsed panel — present in the
  // DOM but display:none — so the menu has to be opened first. Clicking
  // blind passes on desktop and times out on every mobile profile.
  const toggle = page.locator(".ad-nav__toggle");
  if (await toggle.isVisible()) await toggle.click();

  await page.locator(".ad-nav a[href='#about']").first().click();
  await page.waitForTimeout(1200);

  const { navBottom, headingTop } = await page.evaluate(() => ({
    navBottom: document.querySelector(".ad-nav")!.getBoundingClientRect().bottom,
    headingTop: document.querySelector("#about h2")!.getBoundingClientRect().top,
  }));
  expect(headingTop, "heading landed underneath the sticky nav").toBeGreaterThanOrEqual(navBottom - 1);
});

test("stacked buttons are the same width", async ({ page }) => {
  await page.setViewportSize({ width: 405, height: 900 });
  await page.goto("/");
  await page.locator("#contact").scrollIntoViewIfNeeded();

  // Below 576px the contact actions stack, and `align-items: stretch` widens
  // each child. It does not widen the <summary> inside the WhatsApp
  // <details>, which is an inline-flex button and stayed as wide as its own
  // label — 218px against Instagram's 373px, with the smaller tap target on
  // the more important action.
  const widths = await page.evaluate(() =>
    [...document.querySelector(".ad-contact__actions")!.children].map((child) => {
      const control = child.tagName === "DETAILS" ? child.querySelector("summary")! : child;
      return Math.round(control.getBoundingClientRect().width);
    }),
  );

  expect(widths.length).toBeGreaterThan(1);
  const spread = Math.max(...widths) - Math.min(...widths);
  expect(spread, `action buttons differ in width: ${widths.join(" vs ")}px`).toBeLessThanOrEqual(1);
});
