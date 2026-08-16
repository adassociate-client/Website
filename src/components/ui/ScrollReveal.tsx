"use client";

import { useEffect } from "react";

/**
 * Scroll reveal — a direct port of the inline script in the static
 * index.html, mirroring the live site's jkit-fadeinup behaviour.
 *
 * One observer for the whole page rather than one per element, so the
 * sections themselves stay server components carrying only `.ad-observe`.
 * Renders nothing.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".ad-observe");

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
