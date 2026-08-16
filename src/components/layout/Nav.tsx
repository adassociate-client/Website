import NavMenu from "@/components/layout/NavMenu";
import type { Nav as NavData, Site } from "@/types/content";

interface NavProps {
  nav: NavData;
  site: Site;
  /** Which link renders as the current page. Defaults to the first. */
  currentHref?: string;
}

/**
 * `.ad-nav` — sticky header: brand on the left, then the links and the primary
 * CTA. Below 768px the links and CTA collapse into a disclosure panel; that
 * part is a client component, this shell stays on the server.
 */
export default function Nav({ nav, site, currentHref = nav.links[0]?.href }: NavProps) {
  return (
    <nav className="ad-nav">
      <a className="ad-nav__brand" href={nav.links[0]?.href ?? "#"}>
        {/* Intrinsic size stops the header re-flowing once the image lands. */}
        <img src={site.logo} alt={site.name} width={390} height={256} />
      </a>

      <NavMenu links={nav.links} cta={nav.cta} currentHref={currentHref} />
    </nav>
  );
}
