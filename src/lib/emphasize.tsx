import type { ReactNode } from "react";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Renders `text` with each phrase from `phrases` wrapped in <strong>.
 *
 * The static site hardcoded <strong> tags inside the Historia paragraph while
 * content.json kept the prose plain plus an `emphasis` list. This bridges the
 * two so the markup stays identical without duplicating the copy.
 */
export function emphasize(text: string, phrases: string[] = []): ReactNode {
  if (phrases.length === 0) return text;

  // Longest first, so a phrase that contains another still wins the match.
  const pattern = [...phrases]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");

  const parts = text.split(new RegExp(`(${pattern})`, "g"));
  const marked = new Set(phrases);

  return parts.map((part, i) =>
    marked.has(part) ? <strong key={i}>{part}</strong> : part,
  );
}
