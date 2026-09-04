import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * Built from what the page actually loads, checked against a real render:
 * self-hosted fonts and video, no third-party scripts, and a single Google
 * Maps iframe. Anything not listed here is refused by the browser.
 *
 * `'unsafe-inline'` is present for scripts and styles, and that is a real
 * weakening worth naming rather than hiding. Next's App Router streams the
 * RSC payload through inline <script> tags, and the design kit uses inline
 * style attributes; removing it needs a per-request nonce, which forces every
 * page to render dynamically and gives up the static prerender this site
 * depends on. The trade is acceptable here specifically because the page
 * renders no user-supplied content — everything comes from a build-time JSON
 * file — so there is no injection path for a script to arrive through. Wire a
 * nonce via middleware the moment that stops being true.
 *
 * Dev additionally needs 'unsafe-eval' and a websocket origin for react-
 * refresh; neither is emitted in a production build.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self'",
  // The map embed. maps.google.com redirects to www.google.com, so both.
  "frame-src https://www.google.com https://maps.google.com",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  // No plugins, and no <base> rewriting where relative URLs resolve to.
  "object-src 'none'",
  "base-uri 'self'",
  // The form posts to our own API and nowhere else.
  "form-action 'self'",
  // Clickjacking: this page may not be framed by anyone.
  "frame-ancestors 'none'",
  // Deliberately no `upgrade-insecure-requests`. Every asset here is a
  // same-origin relative URL, so there is no mixed content for it to
  // upgrade — and Safari applies it to http://localhost too, where nothing
  // is listening on TLS. That turned `npm run start` previewed in Safari
  // into a blank, unstyled page: the stylesheet, every script and every
  // image failed with an SSL error. Chromium and Firefox exempt localhost;
  // WebKit does not. HSTS below is what actually enforces https in
  // production, and it does not have this failure mode.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Stops a browser second-guessing a declared Content-Type, which is how a
  // served asset gets reinterpreted as a script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Belt to frame-ancestors' braces, for anything too old to honour CSP.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the full URL same-origin, only the origin cross-origin, nothing to
  // an insecure destination — so query strings never leak off-site.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs any of these, so decline them up front.
  {
    key: "Permissions-Policy",
    value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// Only meaningful over HTTPS, and actively unhelpful on a local http origin,
// where it would pin the browser to https://localhost for two years.
if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The version banner is free reconnaissance for anyone matching a CVE to a
  // release.
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The API answers per-request and must never be held by a shared
        // cache; several routes set this themselves, this closes the gap for
        // any that are added later and forget.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
