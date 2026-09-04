import { Fragment } from "react";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import type { Contact as ContactData, Link } from "@/types/content";

interface ContactProps {
  contact: ContactData;
  social: Link[];
}

/** Office, phone and social links beside the lazy-loaded map embed. */
export default function Contact({ contact, social }: ContactProps) {
  return (
    <Section id={contact.id} variant="tall">
      <div className="ad-container ad-grid ad-grid--2">
        <Reveal>
          <Eyebrow>{contact.eyebrow}</Eyebrow>
          <h2>{contact.heading}</h2>

          <p className="ad-lead">
            <strong>{contact.addressLabel}:</strong> {contact.address}
          </p>
          <p className="ad-lead">
            <strong>{contact.phoneLabel}:</strong>{" "}
            {contact.phones.map((phone, i) => (
              <Fragment key={phone.href}>
                {i > 0 && <span className="ad-contact__phone-separator">, </span>}
                {/* nowrap so a number never breaks across two lines — half a
                    phone number at the end of a line is unreadable. The pair
                    still wraps as whole numbers on a narrow screen. */}
                <a className="ad-contact__phone" href={phone.href}>
                  {phone.display}
                </a>
              </Fragment>
            ))}
          </p>
          <p className="ad-lead">
            <strong>{contact.emailLabel}:</strong>{" "}
            {/* An address is one long unbreakable token; on a narrow screen it
                would push the section sideways without this. */}
            <a className="ad-contact__email ad-wrap-anywhere" href={contact.emailHref}>
              {contact.email}
            </a>{" "}
            {/* A mailto: does nothing at all when the machine has no mail app
                registered — a dead click with no error. This gives that
                visitor a way through without pushing Gmail on everyone. */}
            <a
              className="ad-contact__alt"
              href={contact.emailWebHref}
              target="_blank"
              rel="noopener"
            >
              ({contact.emailWebLabel})
            </a>
          </p>

          {/* A class rather than an inline style: inline styles cannot carry a
              media query, and these buttons need to go full width on a phone
              so they stop landing as two cramped half-width taps. */}
          <div className="ad-contact__actions">
            {/* The firm answers on two lines, so a single WhatsApp link would
                have to guess which one. <details> is the whole mechanism —
                native disclosure gives the keyboard behaviour and the
                expanded/collapsed announcement for free, and it still opens
                without JavaScript, so this stays a server component. */}
            <details className="ad-whatsapp">
              <summary className="ad-btn ad-btn--primary ad-whatsapp__summary">
                {contact.whatsapp.label}
                <span className="ad-whatsapp__chevron" aria-hidden="true" />
              </summary>

              <div className="ad-whatsapp__panel">
                <p className="ad-whatsapp__prompt">{contact.whatsapp.prompt}</p>
                <ul className="ad-whatsapp__list">
                  {contact.whatsapp.numbers.map((number) => (
                    <li key={number.href}>
                      <a
                        className="ad-whatsapp__option"
                        href={number.href}
                        target="_blank"
                        rel="noopener"
                      >
                        {number.display}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            {social.map((item) => (
              <Button key={item.href} href={item.href} variant="ghost">
                {item.label}
              </Button>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <iframe
            className="ad-contact__map"
            title={contact.mapTitle}
            aria-label={contact.mapTitle}
            src={contact.mapEmbed}
            loading="lazy"
          />
        </Reveal>
      </div>
    </Section>
  );
}
