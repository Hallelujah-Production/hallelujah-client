"use client";

import type { ReactNode } from "react";
import { AuthOverlay } from "./auth-overlay";
import { Toaster } from "./toaster";

export function FeedbackProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AuthOverlay />
      <Toaster />
    </>
  );
}
