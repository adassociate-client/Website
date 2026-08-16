/**
 * Shape of src/data/content.json — the single source of truth for every
 * string and media reference on the page. Components take these types as
 * props; none of them hardcode copy.
 */

export interface Link {
  label: string;
  href: string;
}

export interface Media {
  src: string;
  alt: string;
}

export interface Phone {
  /** Grouped for reading aloud, e.g. "+91 95668 60808". */
  display: string;
  /** tel: form, E.164 and unspaced, e.g. "tel:+919566860808". */
  href: string;
}

/** The WhatsApp chooser: one button that opens onto the available numbers. */
export interface WhatsApp {
  label: string;
  /** Heading inside the open panel, naming the choice being made. */
  prompt: string;
  /** `href` is a wa.me link with the greeting pre-typed. */
  numbers: Phone[];
}

export interface Site {
  name: string;
  title: string;
  description: string;
  tagline: string;
  url: string;
  language: string;
  founded: number;
  logo: string;
  favicon: string;
}

export interface Nav {
  skipLink: string;
  links: Link[];
  cta: Link;
}

export interface HeadingPart {
  text: string;
  accent: boolean;
}

export interface Hero {
  id: string;
  headingParts: HeadingPart[];
  /** The same words as `headingParts`, unsplit — for reading, not rendering. */
  headingPlain: string;
  /** Supporting line under the h1: what the firm actually supplies. */
  subheading: string;
  video: string;
  poster: string;
  cta: Link;
}

export interface Stat {
  value: string;
  label: string;
}

export interface About {
  id: string;
  eyebrow: string;
  heading: string;
  /** Plain prose; `emphasis` marks the substrings rendered as <strong>. */
  body: string;
  emphasis: string[];
  cta: Link;
  stat: Stat;
  badge: Media;
}

export interface Capability {
  title: string;
  description: string;
  image: string;
  alt: string;
}

export interface Approach {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
  image: string;
  alt: string;
  cta: Link;
}

export interface Work {
  id: string;
  eyebrow: string;
  heading: string;
  images: Media[];
}

export interface Contact {
  id: string;
  eyebrow: string;
  heading: string;
  address: string;
  addressLabel: string;
  phoneLabel: string;
  /** The firm answers on more than one line, so this is a list, not a field. */
  phones: Phone[];
  whatsapp: WhatsApp;
  email: string;
  emailLabel: string;
  /**
   * mailto: form of `email`, with `?subject=` so the composer opens ready to
   * type rather than on a blank subject line. Display and link are separate
   * fields precisely because they differ — never render this one.
   */
  emailHref: string;
  /**
   * Escape hatch for visitors whose machine has no working mail handler, where
   * a mailto: click does nothing at all and the page looks broken. Opens
   * Gmail's web composer, pre-addressed. Offered beside the address, never
   * instead of it — it would strand anyone who does not use Gmail.
   */
  emailWebLabel: string;
  emailWebHref: string;
  mapEmbed: string;
  mapTitle: string;
}

export interface Footer {
  tagline: string;
  visitLabel: string;
  followLabel: string;
  addressLines: string[];
  credit: string;
  copyright: string;
}

export interface Content {
  site: Site;
  nav: Nav;
  hero: Hero;
  about: About;
  capabilities: Capability[];
  approach: Approach;
  work: Work;
  contact: Contact;
  social: Link[];
  footer: Footer;
  buttons: Record<string, string>;
}
