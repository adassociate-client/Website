import ImageBox from "@/components/ui/ImageBox";
import Section from "@/components/ui/Section";
import type { Capability } from "@/types/content";

interface CapabilitiesProps {
  capabilities: Capability[];
}

/** Three service lines on a staggered reveal — strategy, operations, transactions. */
export default function Capabilities({ capabilities }: CapabilitiesProps) {
  return (
    <Section variant="flush">
      <div className="ad-container ad-grid ad-grid--3 ad-stagger">
        {capabilities.map((capability) => (
          <ImageBox key={capability.image} {...capability} />
        ))}
      </div>
    </Section>
  );
}
