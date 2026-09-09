"use client";

import * as React from "react";

/** Safety net if `document.fonts` never settles — better a late dialog than none. */
const FONT_WAIT_MS = 4000;

/**
 * Opens the print dialog once, on arrival, when a screen is reached with
 * ?print=1 — so "Print receipt" from a list goes straight to paper.
 *
 * Waits for `document.fonts` first. A receipt printed in Telugu, Tamil,
 * Kannada, Malayalam or Devanagari needs its Noto face resolved before the
 * page box is measured: print early and the roll comes out either blank or
 * full of tofu boxes, and thermal paper cannot be reprinted for free.
 */
export function AutoPrint({ enabled }: { enabled: boolean }) {
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || fired.current) return;
    fired.current = true;

    let cancelled = false;
    const print = () => {
      if (!cancelled) window.print();
    };

    const ready = document.fonts?.ready ?? Promise.resolve();
    const timer = setTimeout(print, FONT_WAIT_MS);

    void ready.then(() => {
      clearTimeout(timer);
      // One frame after the fonts land, so layout reflows before we measure.
      requestAnimationFrame(() => setTimeout(print, 200));
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled]);

  return null;
}
