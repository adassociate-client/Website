interface EyebrowProps {
  children: string;
}

/** `.ad-eyebrow` — the small uppercase kicker above every section heading. */
export default function Eyebrow({ children }: EyebrowProps) {
  return <p className="ad-eyebrow">{children}</p>;
}
