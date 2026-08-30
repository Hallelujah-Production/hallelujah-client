"use client";

import * as React from "react";

/**
 * Opens the print dialog once, on arrival, when a screen is reached with
 * ?print=1 — so "Print receipt" from a list goes straight to paper.
 */
export function AutoPrint({ enabled }: { enabled: boolean }) {
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || fired.current) return;
    fired.current = true;
    const timer = setTimeout(() => window.print(), 700);
    return () => clearTimeout(timer);
  }, [enabled]);

  return null;
}
