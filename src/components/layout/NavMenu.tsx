"use client";

import { useEffect, useRef, useState } from "react";
import type { Link } from "@/types/content";

interface NavMenuProps {
  links: Link[];
  cta: Link;
  /** Which link renders as the current page. */
  currentHref?: string;
}

/**
 * The navigation list, plus the button that discloses it below 768px.
 *
 * Previously `.ad-nav__links` was simply `display: none` under 768px with
 * nothing in its place, so every phone visitor lost the whole navigation.
 *
 * One list serves both layouts rather than a desktop copy and a mobile copy:
 * duplicated markup would announce every destination twice to a screen
 * reader. CSS turns the same <ul> into an inline bar at 768px and a dropdown
 * panel below it, and the CTA rides along as the last item — pushed to the
 * right of the bar on desktop, full width inside the panel on mobile.
 *
 * This is a client component because the disclosure needs state; the sections
 * it sits above all remain server components.
 */
export default function NavMenu({ links, cta, currentHref }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Escape should leave focus somewhere sensible, not on a hidden link.
      toggleRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Rotating a phone to landscape can cross the 768px line. Without this the
  // menu stays flagged open, and the panel styles no longer apply — so the
  // next tap of the (now hidden) button would toggle it shut instead of open.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const sync = () => desktop.matches && setOpen(false);

    sync();
    desktop.addEventListener("change", sync);
    return () => desktop.removeEventListener("change", sync);
  }, []);

  return (
    <div className="ad-nav__menu" ref={containerRef}>
      <button
        type="button"
        ref={toggleRef}
        className="ad-nav__toggle"
        aria-expanded={open}
        aria-controls="ad-nav-menu"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        {/* aria-hidden: the bars are decoration, the label below is the name. */}
        <span className="ad-nav__toggle-icon" data-open={open} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="ad-sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      <ul className="ad-nav__links" id="ad-nav-menu" data-open={open}>
        {links.map((link) => (
          <li key={link.href}>
            <a
              className="ad-nav__link"
              href={link.href}
              aria-current={link.href === currentHref ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          </li>
        ))}

        <li className="ad-nav__cta-item">
          <a
            className="ad-btn ad-btn--primary ad-nav__cta"
            href={cta.href}
            onClick={() => setOpen(false)}
          >
            {cta.label}
          </a>
        </li>
      </ul>
    </div>
  );
}
