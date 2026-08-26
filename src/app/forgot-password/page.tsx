import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/layout/church-mark";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your church workspace.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh min-h-screen flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10">
      <Link href="/" className="w-fit min-w-0 rounded" aria-label="Hallelujah home">
        <BrandMark size="md" className="lg:hidden" />
        <BrandMark size="lg" className="hidden lg:inline-flex" />
      </Link>

      <main id="main-content" className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Reset your password
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Enter the email address for your church account. If it is registered, we will
            send a reset link. The message is the same either way, so accounts stay
            private.
          </p>
          <div className="mt-8">
            <ForgotPasswordForm />
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
