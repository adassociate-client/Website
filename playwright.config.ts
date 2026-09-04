import { defineConfig, devices } from "@playwright/test";

/** Specs whose result can differ by rendering engine. */
const CROSS_ENGINE = /(media|content).spec.ts/;
/** Those, plus the layout checks that only mean anything on a touch device. */
const MOBILE = /(media|content|layout).spec.ts/;

/**
 * End-to-end configuration.
 *
 * `webServer` starts the app itself, so a run needs no separate terminal and
 * cannot silently test a stale dev server. It serves the production build
 * deliberately: the security headers in next.config.ts differ between
 * dev and production (HSTS, and CSP drops 'unsafe-eval'), and testing dev
 * would pass a policy that never ships.
 *
 * Firefox and WebKit are in the matrix for a specific reason — the hero video
 * shipped as HEVC for a while, which Chromium played on this machine and
 * Firefox could not play at all. A Chromium-only suite is blind to exactly
 * that class of bug.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  /**
   * Deliberately below the CPU count. Each worker drives a browser that
   * fetches and decodes the 2.2MB hero video against a single-process Next
   * server; at the default worker count they starve each other and tests that
   * take two seconds alone time out at thirty.
   */
  workers: process.env.CI ? 2 : 3,
  /** Generous: the slowest tests walk the whole page so lazy media loads. */
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: "http://localhost:3000",
    // Artefacts only for failures — a green run should leave nothing behind.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Only on a retry. "retain-on-failure" records every test and throws the
    // passes away, which meant recording video of a page that plays video, in
    // every worker — teardown then outran the test timeout.
    video: "on-first-retry",
  },

  /**
   * Chromium carries the whole suite. The other engines run only the specs
   * where engine behaviour actually differs — codec support and autoplay
   * policy, link handling, <details>. The nine-viewport layout sweep is CSS
   * box maths against the same stylesheet, so running it five times told us
   * nothing and cost most of the wall clock.
   */
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testMatch: CROSS_ENGINE },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: CROSS_ENGINE },
    // Real mobile profiles: touch, device pixel ratio and a mobile user agent,
    // which viewport size alone does not give you.
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] }, testMatch: MOBILE },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] }, testMatch: MOBILE },
  ],

  webServer: {
    // Serve only. The build is a separate step in the test:e2e script so a
    // ~50s compile is not competing with this timeout, and so a build failure
    // reports as a build failure rather than as "server never came up".
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
