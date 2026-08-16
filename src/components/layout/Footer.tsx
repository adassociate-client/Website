import Eyebrow from "@/components/ui/Eyebrow";
import type { Footer as FooterData, Link, Phone, Site } from "@/types/content";

interface FooterProps {
  footer: FooterData;
  site: Site;
  social: Link[];
  phones: Phone[];
  email: string;
  emailHref: string;
}

/** `.ad-footer` — brand blurb, address, social list, then the bottom bar. */
export default function Footer({
  footer,
  site,
  social,
  phones,
  email,
  emailHref,
}: FooterProps) {
  return (
    <footer className="ad-footer">
      <div className="ad-container">
        <div className="ad-footer__grid">
          <div>
            <img
              className="ad-footer__logo"
              src={site.logo}
              alt={site.name}
              width={390}
              height={256}
            />
            <p className="ad-muted" style={{ maxWidth: "38ch" }}>
              {footer.tagline}
            </p>
          </div>

          <div>
            <Eyebrow>{footer.visitLabel}</Eyebrow>
            <ul className="ad-footer__list ad-caption">
              {footer.addressLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
              {phones.map((phone) => (
                <li key={phone.href}>
                  <a className="ad-contact__phone" href={phone.href}>
                    {phone.display}
                  </a>
                </li>
              ))}
              <li>
                <a className="ad-wrap-anywhere" href={emailHref}>
                  {email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <Eyebrow>{footer.followLabel}</Eyebrow>
            <ul className="ad-footer__list ad-caption">
              {social.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noopener">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ad-footer__bottom">
          <span>{footer.copyright}</span>
          <span>{footer.credit}</span>
        </div>
      </div>
    </footer>
  );
}
