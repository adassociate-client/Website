"use client";

import { useEffect, useState } from "react";

interface HeroMediaProps {
  video: string;
  poster: string;
}

/**
 * Mounts the hero video once it is clear the visitor can afford it.
 *
 * It plays on phones. It did not while the file was 18MB of 4K, which was the
 * whole reason the site could not be browsed on a mobile connection; now that
 * it is 2.2MB of H.264 the width test it used to fail is no longer measuring
 * anything real, so it is gone.
 *
 * Two checks remain, and both describe an actual constraint rather than a
 * guess about the device:
 *
 *   - Save-Data, or a 2G/3G connection. Someone who has asked their browser to
 *     conserve data has said so explicitly, and a decorative loop is precisely
 *     what that setting is for.
 *   - prefers-reduced-motion. The stylesheet also hides the element, but
 *     hiding happens after the bytes have arrived; not fetching is better.
 *
 * Where the video is skipped the hero still shows its poster still, because
 * `.ad-hero` paints it as a background either way — so the section looks
 * finished rather than empty, at 120KB.
 *
 * `muted` and `playsInline` are what make autoplay legal on iOS and Android;
 * without both, mobile Safari refuses to start and shows a paused frame.
 */
export default function HeroMedia({ video, poster }: HeroMediaProps) {
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    const motionWelcome = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Network Information API: Chromium-only. Absent means unknown, and
    // unknown is treated as fine — this is an opt-out, not a gate.
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const affordable =
      !connection ||
      (!connection.saveData && !/(^|-)2g$|^3g$/.test(connection.effectiveType ?? ""));

    setShouldPlay(motionWelcome && affordable);
  }, []);

  if (!shouldPlay) return null;

  return (
    <video className="ad-hero__media" autoPlay loop muted playsInline poster={poster}>
      <source src={video} type="video/mp4" />
    </video>
  );
}
