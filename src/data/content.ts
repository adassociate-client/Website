import raw from "./content.json";
import type { Content } from "@/types/content";

/**
 * Typed accessor for the site copy. Every component reads from here rather
 * than embedding strings, so a copy change is a JSON edit — no JSX touched.
 *
 * The JSON is imported (not fetched), so it is inlined at build time and the
 * whole page stays a static server render.
 */
export const content = raw as unknown as Content;

export const {
  site,
  nav,
  hero,
  about,
  products,
  work,
  contact,
  social,
  footer,
} = content;

export default content;
