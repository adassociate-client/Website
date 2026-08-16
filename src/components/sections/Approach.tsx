import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import type { Approach as ApproachData } from "@/types/content";

interface ApproachProps {
  approach: ApproachData;
}

/** Two-up, image-first: how the firm staffs and runs an engagement. */
export default function Approach({ approach }: ApproachProps) {
  return (
    <Section id={approach.id} variant="tall">
      <div className="ad-container ad-grid ad-grid--2" style={{ alignItems: "center" }}>
        {/* `ad-observe` sits on the image itself so it stays a direct grid child. */}
        <img
          className="ad-observe"
          src={approach.image}
          alt={approach.alt}
          style={{
            borderRadius: "var(--ad-radius-arch)",
            border: "1px solid var(--ad-border)",
          }}
        />

        <Reveal>
          <Eyebrow>{approach.eyebrow}</Eyebrow>
          <h2>{approach.heading}</h2>
          <p className="ad-lead">{approach.body}</p>
          <Button href={approach.cta.href}>{approach.cta.label}</Button>
        </Reveal>
      </div>
    </Section>
  );
}
