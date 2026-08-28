"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/layout/church-mark";
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

const COPY = {
  signin: {
    title: "Signing you in",
    hint: "Opening your parish workspace",
  },
  signout: {
    title: "Signing you out",
    hint: "Ending this session securely",
  },
} as const;

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

  if (!state.mode) return null;

  const copy = COPY[state.mode];

  return (
    <div
      data-print="hide"
      className="auth-overlay-in fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={copy.title}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(28rem 18rem at 50% 42%, hsl(38 62% 48% / 0.12), transparent 68%), radial-gradient(36rem 22rem at 50% 58%, hsl(218 54% 18% / 0.08), transparent 70%)",
        }}
      />

      <div className="relative flex w-[min(20rem,calc(100vw-2.5rem))] flex-col items-center text-center">
        <div className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-border" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
          <BrandMark showName={false} size="md" />
        </div>

        <p
          className="mt-6 text-[1.65rem] leading-none text-primary"
          style={{ fontFamily: "var(--font-script), cursive" }}
        >
          Hallelujah
        </p>
        <p className="mt-3 font-display text-base font-semibold tracking-tight text-foreground">
          {copy.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.hint}</p>

        <div className="mt-7 h-1 w-44 overflow-hidden rounded-full bg-border">
          <div className="auth-overlay-bar h-full w-1/3 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
