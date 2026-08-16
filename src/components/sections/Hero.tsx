import type { CSSProperties } from "react";
import Button from "@/components/ui/Button";
import type { Hero as HeroData } from "@/types/content";

interface HeroProps {
  hero: HeroData;
}

/**
 * `.ad-hero` — looping muted video behind a scrim, with the accent-word
 * heading and the primary CTA. Scrim, never blur: blur is an anti-pattern here.
 */
export default function Hero({ hero }: HeroProps) {
  return (
    <section
      className="ad-hero"
      id={hero.id}
      // Read by the prefers-reduced-motion rule in components.css, which
      // drops the looping video and shows this still instead.
      style={{ "--ad-hero-poster": `url(${hero.poster})` } as CSSProperties}
    >
      <video
        className="ad-hero__media"
        autoPlay
        loop
        muted
        playsInline
        poster={hero.poster}
      >
        <source src={hero.video} type="video/mp4" />
      </video>

      <div className="ad-hero__scrim" />

      <div className="ad-hero__content ad-container">
        <h1 className="animated fadeIn">
          {hero.headingParts.map((part, i) =>
            part.accent ? (
              <span className="hero_span" key={i}>
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </h1>

        {/* The second statement is set as a subheading rather than more h1:
            at the h1's 100px ceiling both lines together would run past the
            bottom of the hero, and it reads as support for the headline
            rather than a second headline. */}
        <p className="ad-hero__sub">{hero.subheading}</p>

        <Button href={hero.cta.href}>{hero.cta.label}</Button>
      </div>
    </section>
  );
}
