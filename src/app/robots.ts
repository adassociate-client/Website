import type { MetadataRoute } from "next";

/**
 * Crawl rules.
 *
 * The site is one page, so there is nothing to guide a crawler around — the
 * value here is the exclusion. /api is rate limited and has no search value,
 * and a crawler walking it spends the same per-IP budget a visitor would.
 *
 * No `sitemap` entry: that field needs an absolute URL, and the production
 * domain is not settled (`site.url` in content.json is still a placeholder).
 * Pointing a sitemap at the wrong host is worse than omitting it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
  };
}
