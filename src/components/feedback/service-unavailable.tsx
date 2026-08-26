"use client";

import { WifiOff } from "lucide-react";
import { BrandMark } from "@/components/layout/church-mark";
import { Button } from "@/components/ui/button";

export function ServiceUnavailable() {
  return (
    <div className="flex min-h-dvh min-h-screen flex-col items-center justify-center px-6 py-16 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] text-center">
      <BrandMark size="md" className="lg:hidden" />
      <BrandMark size="lg" className="hidden lg:inline-flex" />
      <span
        aria-hidden="true"
        className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted text-primary"
      >
        <WifiOff className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
        We couldn’t reach the server
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Check your connection and try again. Nothing on this page has been changed.
      </p>
      <Button className="mt-7" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}
