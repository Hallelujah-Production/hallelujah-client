import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceUnavailable } from "@/components/feedback/service-unavailable";
import { requireAuth } from "@/lib/guards";
import type { Session } from "@/lib/session";
import { ApiError } from "@/lib/api/errors";
import AppLoading from "./loading";

function isNextControlFlow(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (error as { digest: string }).digest.startsWith("NEXT_NOT_FOUND"))
  );
}

export const dynamic = "force-dynamic";

/** Every authenticated screen is private and must never be indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

async function loadAppSession(): Promise<Session | "unavailable"> {
  try {
    return await requireAuth();
  } catch (error) {
    if (isNextControlFlow(error)) throw error;
    if (error instanceof ApiError && error.isNetwork) return "unavailable";
    throw error;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await loadAppSession();
  if (session === "unavailable") return <ServiceUnavailable />;

  return (
    <AppShell session={session}>
      <Suspense fallback={<AppLoading />}>{children}</Suspense>
    </AppShell>
  );
}
