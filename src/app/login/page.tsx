import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/layout/church-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Church login",
  description: "Sign in to your church workspace on Hallelujah.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="grid min-h-dvh min-h-screen bg-background lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10 lg:px-14">
        <Link href="/" className="w-fit min-w-0 rounded" aria-label="Hallelujah home">
          <BrandMark size="md" className="lg:hidden" />
          <BrandMark size="lg" className="hidden lg:inline-flex" />
        </Link>

        <main id="main-content" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sign in to your church workspace to manage intentions, verify offerings and
              issue receipts.
            </p>

            <div className="mt-8">
              <LoginForm created={params.created === "1"} />
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Church accounts are created by the Hallelujah team.{" "}
              <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
                Request an account
              </Link>
            </p>
          </div>
        </main>

        <p className="text-center text-xs text-muted-foreground">
          Families do not need an account.{" "}
          <Link href="/churches" className="underline underline-offset-4 hover:text-foreground">
            Submit a prayer intention
          </Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(40rem 24rem at 78% 12%, hsl(38 62% 60%), transparent 62%), radial-gradient(38rem 26rem at 10% 88%, hsl(152 34% 46%), transparent 62%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.04) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
          }}
        />

        <div className="relative p-14">
          <p className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent">
            <span aria-hidden="true" className="h-px w-6 bg-accent" />
            The parish register
          </p>
          <p className="mt-6 max-w-md font-display text-4xl font-semibold leading-[1.12] tracking-tight">
            Every intention accounted for. Every offering recorded. Every receipt ready to
            hand over.
          </p>
        </div>

        <div className="relative space-y-4 p-14">
          <div className="max-w-md rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
              Your church, and only your church
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
              Signing in opens your parish workspace. Intentions, customers, payments and
              reports are scoped to your church — no other tenant&apos;s records are
              reachable from this account.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
