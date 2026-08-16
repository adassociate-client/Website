import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import Stat from "@/components/ui/Stat";
import { emphasize } from "@/lib/emphasize";
import type { About as AboutData } from "@/types/content";

interface AboutProps {
  about: AboutData;
}

/** Two-up: who the firm is on the left, the headline stat and badge on the right. */
export default function About({ about }: AboutProps) {
  return (
    <Section id={about.id} variant="tall">
      <div className="ad-container ad-grid ad-grid--2" style={{ alignItems: "center" }}>
        <Reveal>
          <Eyebrow>{about.eyebrow}</Eyebrow>
          <h2>{about.heading}</h2>
          <p className="ad-lead">{emphasize(about.body, about.emphasis)}</p>
          <Button href={about.cta.href}>{about.cta.label}</Button>
        </Reveal>

        <Reveal>
          <Stat
            value={about.stat.value}
            label={about.stat.label}
            style={{ marginBottom: "var(--ad-space-4)" }}
          />
          <img className="ad-about__badge" src={about.badge.src} alt={about.badge.alt} />
        </Reveal>
      </div>
    </Section>
  );
}
