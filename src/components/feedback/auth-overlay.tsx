"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { authOverlay } from "@/lib/feedback/auth-overlay";
import { toast } from "@/lib/feedback/toast";

/**
 * Sign-in overlay. Cleared when the destination route commits.
 *
 * After a cookie-setting Server Action, Next.js App Router can fetch the
 * destination RSC and still leave the URL on /login (action refresh deadlock).
 * If the URL has not changed shortly after commit, we fall back to a full
 * navigation so this overlay can never stay up indefinitely.
 */
const REPLACE_FAILSAFE_MS = 800;

export function AuthOverlay() {
  const pathname = usePathname();
  const state = React.useSyncExternalStore(
    authOverlay.subscribe,
    authOverlay.getSnapshot,
    authOverlay.getSnapshot,
  );

  React.useEffect(() => {
    const arrived = authOverlay.consumeArrival(pathname);
    if (arrived) {
      toast[arrived.tone]({ title: arrived.title, message: arrived.message, duration: 5600 });
      return;
    }

    if (state.mode !== "signin" || !state.destination) return;

    const destination = state.destination;
    const failsafe = window.setTimeout(() => {
      const current = authOverlay.getSnapshot();
      if (current.destination !== destination) return;
      if (window.location.pathname === destination) {
        authOverlay.abort();
        return;
      }
      if (process.env.NODE_ENV === "development") {
        console.warn(`[auth] router.replace did not commit; falling back to ${destination}`);
      }
      window.location.replace(destination);
    }, REPLACE_FAILSAFE_MS);

    return () => window.clearTimeout(failsafe);
  }, [pathname, state.mode, state.destination]);

  if (!state.mode || state.mode !== "signin") return null;

  return (
    <div
      data-print="hide"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="font-display text-base font-semibold text-foreground">Signing in…</p>
    </div>
  );
}
