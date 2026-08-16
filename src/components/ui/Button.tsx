import type { CSSProperties, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  /** Adds rel="nofollow" — used on the off-site menu PDF links. */
  nofollow?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** `.ad-btn` — the design kit's only button. Hover lifts by `--ad-lift`. */
export default function Button({
  href,
  children,
  variant = "primary",
  nofollow = false,
  className = "",
  style,
}: ButtonProps) {
  const external = /^https?:\/\//.test(href);
  const classes = ["ad-btn", `ad-btn--${variant}`, className].filter(Boolean).join(" ");

  return (
    <a
      className={classes}
      href={href}
      style={style}
      target={external ? "_blank" : undefined}
      rel={external ? (nofollow ? "nofollow noopener" : "noopener") : undefined}
    >
      {children}
    </a>
  );
}
