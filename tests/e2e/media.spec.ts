import { test, expect } from "@playwright/test";

/**
 * Media weight and playback.
 *
 * The hero video was HEVC for a while, which Chromium plays on Windows and
 * Firefox cannot play at all — so it failed silently for a whole browser
 * while looking perfect in testing. Running this across the project matrix is
 * the point of it.
 */

test("the hero video actually plays", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3000);

  const video = page.locator(".ad-hero__media");
  const mounted = await video.count();

  if (mounted === 0) {
    // HeroMedia legitimately withholds it under reduced motion or Save-Data.
    // The poster must then be carrying the hero instead of leaving it empty.
    const background = await page.locator(".ad-hero").evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(background, "no video and no poster — the hero would be blank").not.toBe("none");
    return;
  }

  const before = await video.evaluate((v: HTMLVideoElement) => ({ t: v.currentTime, paused: v.paused }));
  await page.waitForTimeout(1800);
  const after = await video.evaluate((v: HTMLVideoElement) => v.currentTime);

  expect(before.paused, "video mounted but never started").toBe(false);
  expect(after, "video is mounted and unpaused but not advancing — usually a codec the browser cannot decode")
    .toBeGreaterThan(before.t);
});

test("autoplay attributes required by mobile browsers are present", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  const video = page.locator(".ad-hero__media");
  if ((await video.count()) === 0) test.skip(true, "video withheld on this profile");

  // Without both, mobile Safari refuses to autoplay and shows a frozen frame.
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  // The attribute, not the IDL property: Firefox never implemented
  // HTMLMediaElement.playsInline (it has no fullscreen-forcing behaviour to
  // opt out of), so the property reads undefined there while the attribute
  // is present and correct. iOS Safari reads the attribute, which is what
  // actually matters.
  expect(await video.evaluate((v: HTMLVideoElement) => v.hasAttribute("playsinline"))).toBe(true);
});

test("below-the-fold images are lazy and sized", async ({ page }) => {
  await page.goto("/");

  const eager = await page.evaluate(() =>
    [...document.images]
      .filter((i) => !i.closest(".ad-nav") && !i.closest(".ad-footer"))
      .filter((i) => i.loading !== "lazy")
      .map((i) => i.currentSrc.split("/").pop()),
  );
  expect(eager, "images below the fold fetched eagerly").toEqual([]);

  // Intrinsic dimensions reserve the space, so nothing jumps as they arrive.
  const unsized = await page.evaluate(() =>
    [...document.images].filter((i) => !i.getAttribute("width") || !i.getAttribute("height"))
      .map((i) => i.currentSrc.split("/").pop()),
  );
  expect(unsized, "images without width/height will shift the layout").toEqual([]);
});

test("the page stays within a sane weight budget", async ({ page }) => {
  const bytes = new Map<string, number>();
  page.on("response", (r) => {
    const url = r.url();
    if (!url.startsWith("http://localhost")) return;
    bytes.set(url, Math.max(bytes.get(url) ?? 0, Number(r.headers()["content-length"] ?? 0)));
  });

  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(4000);

  const totalMb = [...bytes.values()].reduce((a, b) => a + b, 0) / 1024 / 1024;
  // It was 26MB, which is what made the site unusable on a phone.
  //
  // Raised from 5MB to 6.5MB deliberately, once, and the reason should stay
  // visible: the hero was encoded at 30fps to save bytes and the judder was
  // obvious on the aerial footage. Restoring 60fps cost ~1MB. Smoothness on
  // the one piece of motion the site has was judged worth it at this size —
  // the failure being guarded against is a slide back toward 26MB, not the
  // difference between 4.4 and 5.4.
  //
  // If a future clip cannot fit, shorten it. Duration is what costs: 70
  // seconds at 60fps is the whole problem, and a 20-second loop would be
  // smoother *and* sharper *and* smaller than what is here now.
  expect(totalMb, `page weight is ${totalMb.toFixed(2)}MB`).toBeLessThan(6.5);
});

test("no image is served as a PNG photograph", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);

  // Photographs as PNG cost roughly ten times the JPEG; this was 7.8MB of it.
  const pngPhotos = await page.evaluate(() =>
    [...document.images]
      .map((i) => i.currentSrc)
      .filter((src) => /\/(feature|gallery|hero-poster)-?\d*\.png$/i.test(src)),
  );
  expect(pngPhotos, "photographs shipped as PNG").toEqual([]);
});
