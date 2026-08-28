import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/layout/church-mark";
import { getSession, landingRouteForRole } from "@/lib/session";
import { ChangePasswordForm } from "@/app/(app)/settings/change-password-form";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  /**
   * Do not redirect when mustChangePassword is already false.
   *
   * A successful first password change re-renders this page as part of the
   * Server Action. By then password_changed_at is set, so a redirect here
   * would send the user to the dashboard before the client can open the
   * one-time recovery-code modal. The form redirects after the modal (or
   * immediately when this URL is opened after the password is already set).
   */
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
            An administrator set the password for {session.currentUser.email}. Enter that
            password, then choose one only you know before opening the workspace.
          </p>
          <div className="mt-8">
            <ChangePasswordForm
              redirectOnSuccess={landingRouteForRole(session.currentRole)}
              leaveIfAlreadyChanged={!session.mustChangePassword}
            />
          </div>
          <div className="mt-8 text-center">
            <SignOutButton />
          </div>
        </div>
      </main>
    </div>
  );
}
