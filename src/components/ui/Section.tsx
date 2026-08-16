import type { ReactNode } from "react";

type Variant = "tall" | "flush" | "hero" | "default";

const VARIANT_CLASS: Record<Variant, string> = {
  tall: "ad-section--tall",
  flush: "ad-section--flush",
  hero: "ad-section--hero",
  default: "ad-section",
};

interface SectionProps {
  children: ReactNode;
  /** Anchor target for the nav links. */
  id?: string;
  variant?: Variant;
  className?: string;
}

/** Vertical rhythm wrapper — the `.ad-section--*` padding scale. */
export default function Section({
  children,
  id,
  variant = "tall",
  className = "",
}: SectionProps) {
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(" ");
  return (
    <section className={classes} id={id}>
      {children}
    </section>
  );
}
