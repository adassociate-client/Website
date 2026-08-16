"use client";

import { useState } from "react";

const HIDDEN = { position: "absolute", left: "-9999px" } as const;
const SHOWN = { position: "absolute", left: "16px", top: "16px", zIndex: 10000 } as const;

interface SkipLinkProps {
  label: string;
  href?: string;
}

/**
 * Keyboard-only jump to <main>. Offscreen until focused — a port of the
 * inline onfocus/onblur handlers from the static page.
 */
export default function SkipLink({ label, href = "#content" }: SkipLinkProps) {
  const [focused, setFocused] = useState(false);

  return (
    <a
      className="ad-btn ad-btn--ghost ad-skip-link"
      href={href}
      style={focused ? SHOWN : HIDDEN}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {label}
    </a>
  );
}
