import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/layout/church-mark";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? raw[0] : raw;

  return (
    <div className="flex min-h-dvh min-h-screen flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10">
      <Link href="/" className="w-fit min-w-0 rounded" aria-label="Hallelujah home">
        <BrandMark size="md" className="lg:hidden" />
        <BrandMark size="lg" className="hidden lg:inline-flex" />
      </Link>

      <main id="main-content" className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Choose a new password
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Use at least 10 characters. After you save it, sign in with the new password.
          </p>
          <div className="mt-8">
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <p
                role="alert"
                className="rounded-md border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
              >
                This reset link is incomplete. Request a new one from the sign-in page.
              </p>
            )}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
