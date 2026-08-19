"use client";

import { useEffect, useState } from "react";

interface HeroMediaProps {
  video: string;
  poster: string;
}

/**
 * Decides whether the hero video is worth fetching, and only then mounts it.
 *
 * The file is 18MB. Rendering the <video> on the server meant every phone
 * downloaded all of it before the rest of the page could finish — which is
 * what made the site feel like it never loaded on a mobile connection. It also
 * bought very little there: the footage is a 3:1 cinematic crop, so a portrait
 * phone only ever sees about 22% of the frame.
 *
 * Where the video is skipped the hero still shows its poster still, because
 * `.ad-hero` paints it as a background regardless — so the section looks
 * finished rather than empty, and costs 120KB instead of 18MB.
 *
 * Held back for narrow screens, for a saver/slow connection at any size, and
 * for prefers-reduced-motion — the last of which the stylesheet also hides,
 * but hiding happens after the download, and not fetching is the better
 * outcome.
 */
export default function HeroMedia({ video, poster }: HeroMediaProps) {
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    const wideEnough = window.matchMedia("(min-width: 768px)").matches;
    const motionWelcome = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Network Information API: present on Chromium, absent on Safari/Firefox.
    // Absent means unknown, and unknown is treated as fine — the width check
    // is doing the heavy lifting.
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const affordable =
      !connection ||
      (!connection.saveData && !/(^|-)2g$|^3g$/.test(connection.effectiveType ?? ""));

    setShouldPlay(wideEnough && motionWelcome && affordable);
  }, []);

  if (!shouldPlay) return null;

  return (
    <video className="ad-hero__media" autoPlay loop muted playsInline poster={poster}>
      <source src={video} type="video/mp4" />
    </video>
  );
}
