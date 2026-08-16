import type { CSSProperties, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Marks a block for scroll reveal. The `.ad-observe` class holds it at
 * opacity 0 / translateY(30px); ScrollReveal adds `.is-visible` when it
 * enters the viewport. Rendered on the server — only the observer is client.
 */
export default function Reveal({ children, className = "", style }: RevealProps) {
  return (
    <div className={`ad-observe ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
