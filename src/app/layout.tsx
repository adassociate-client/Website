import type { Metadata } from "next";
import { site } from "@/data/content";
import "./globals.css";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  icons: { icon: site.favicon },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Browser extensions inject attributes onto <html> and <body> (e.g.
    // `crxlauncher`) before React hydrates, which React reports as a mismatch.
    // suppressHydrationWarning applies to this element's attributes only —
    // real mismatches inside the tree are still reported.
    <html lang={site.language} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Everything here is server-rendered, so the page should survive
            without JavaScript — but two things are JS-gated and both fail
            closed rather than open:

            .ad-observe holds each section at opacity 0 until ScrollReveal's
            observer adds .is-visible, so with scripting off the entire page
            below the hero is blank. The nav's disclosure panel has the same
            problem: no script, no way to open it.

            !important is warranted here: these rules exist purely to defeat
            the JS-dependent ones, and this block only ever applies when the
            script that would undo them cannot run. */}
        <noscript>
          <style>{`
            .ad-observe { opacity: 1 !important; transform: none !important; }
            @media (max-width: 767px) {
              .ad-nav { flex-wrap: wrap; }
              .ad-nav__toggle { display: none; }
              .ad-nav__links {
                display: flex !important;
                position: static;
                flex-flow: row wrap;
                width: 100%;
                box-shadow: none;
                border-bottom: 0;
                padding-inline: 0;
              }
              .ad-nav__cta-item { width: 100%; }
            }
          `}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
