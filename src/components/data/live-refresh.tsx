"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/** Pulls a fresh RSC payload so other signed-in roles see backend status without F5. */
export function LiveRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    const timer = window.setInterval(refreshIfVisible, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
      window.clearInterval(timer);
    };
  }, [intervalMs, router]);

  return null;
}
