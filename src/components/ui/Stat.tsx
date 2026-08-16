import type { CSSProperties } from "react";
import type { Stat as StatData } from "@/types/content";

interface StatProps extends StatData {
  style?: CSSProperties;
}

/** `.ad-stat` — big accent number over an uppercase caption. */
export default function Stat({ value, label, style }: StatProps) {
  return (
    <div className="ad-stat" style={style}>
      <div className="ad-stat__value">{value}</div>
      <div className="ad-stat__label">{label}</div>
    </div>
  );
}
