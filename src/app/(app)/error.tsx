"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary for the authenticated application.
 * The message stays generic: an error string can carry internals, and this
 * screen is not the place to leak them.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // The connected application forwards this to the error tracker.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive-muted text-destructive"
      >
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
        Something went wrong.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This screen could not be loaded. Nothing has been changed — try again, and if it
        keeps happening let the parish office know.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
