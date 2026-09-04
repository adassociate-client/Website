import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility, checked with axe rather than by eye.
 *
 * This suite found two WCAG AA colour-contrast failures that had been shipped
 * and were invisible to every other check: white on the olive accent at
 * 3.76:1 across the site's primary call to action, and the teal caption on the
 * card surface at 3.81:1. Both are fixed; these tests stop them returning.
 */

/**
 * Refuses to report on an unstyled page.
 *
 * An unstyled page is black-on-white and sails through every contrast rule, so
 * a broken stylesheet reads as a perfect score. That is not hypothetical: a
 * stale `next start` process was serving old HTML whose CSS hash no longer
 * existed, the page rendered with browser defaults, and the scan reported zero
 * violations. The audit is only meaningful if the design is actually applied.
 */
async function assertStylesheetApplied(page: import("@playwright/test").Page) {
  const applied = await page.evaluate(() => ({
    navPosition: getComputedStyle(document.querySelector(".ad-nav")!).position,
    accent: getComputedStyle(document.documentElement).getPropertyValue("--ad-accent").trim(),
  }));
  expect(applied.navPosition, "stylesheet did not load — any audit below would be meaningless").toBe("sticky");
  expect(applied.accent, "design tokens missing — stylesheet did not load").toBeTruthy();
}

/** Brings every revealed block into view so axe sees the whole page. */
async function revealAll(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    for (const el of document.querySelectorAll(".ad-observe")) {
      el.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

test("no accessibility violations", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await assertStylesheetApplied(page);
  await revealAll(page);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();

  const summary = results.violations.map(
    (v) => `[${v.impact}] ${v.id} (${v.nodes.length}): ${v.help}`,
  );
  expect(summary, "axe violations").toEqual([]);
});

test("no accessibility violations with the mobile menu open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "load" });
  await assertStylesheetApplied(page);

  // The panel is display:none until opened, so axe never sees it otherwise —
  // an open disclosure is a different tree and worth scanning on its own.
  await page.locator(".ad-nav__toggle").click();
  await expect(page.locator(".ad-nav__links")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include(".ad-nav")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations.map((v) => `${v.id}: ${v.help}`), "violations in the open nav").toEqual([]);
});

test("interactive colours clear the AA contrast floor", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await assertStylesheetApplied(page);

  // Asserted directly as well as through axe, because axe only sees the
  // resting state — the hover fill used to be *darker* than the default, so
  // the interaction meant to draw attention lowered contrast below AA.
  const ratios = await page.evaluate(() => {
    const lum = (c: string) => {
      const [r, g, b] = c.match(/\d+/g)!.slice(0, 3).map(Number).map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const root = getComputedStyle(document.documentElement);
    const hex = (name: string) => root.getPropertyValue(name).trim();
    const toRgb = (h: string) => {
      const n = h.replace("#", "");
      return `rgb(${[0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)).join(",")})`;
    };
    const btn = getComputedStyle(document.querySelector(".ad-btn--primary")!);
    const label = getComputedStyle(document.querySelector(".ad-stat__label")!);
    const card = getComputedStyle(document.querySelector(".ad-stat")!);
    return {
      buttonResting: ratio(btn.color, btn.backgroundColor),
      buttonHover: ratio(btn.color, toRgb(hex("--ad-accent-light"))),
      statLabel: ratio(label.color, card.backgroundColor),
    };
  });

  expect(ratios.buttonResting, "primary button, resting").toBeGreaterThanOrEqual(4.5);
  expect(ratios.buttonHover, "primary button, hover fill").toBeGreaterThanOrEqual(4.5);
  expect(ratios.statLabel, "stat label on the card surface").toBeGreaterThanOrEqual(4.5);
});
