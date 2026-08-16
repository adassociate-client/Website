import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import type { Work as WorkData } from "@/types/content";

interface WorkProps {
  work: WorkData;
}

/** `.ad-gallery` — 2-up on mobile, 4-up from 768px, each tile lifting on hover. */
export default function Work({ work }: WorkProps) {
  return (
    <Section id={work.id} variant="flush">
      <div className="ad-container">
        <Eyebrow>{work.eyebrow}</Eyebrow>
        <h2 style={{ marginBottom: "var(--ad-space-8)" }}>{work.heading}</h2>

        <Reveal className="ad-gallery">
          {work.images.map((image) => (
            <img key={image.src} src={image.src} alt={image.alt} />
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
