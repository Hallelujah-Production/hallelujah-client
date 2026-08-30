import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/layout/church-mark";
import { apiPost } from "@/lib/api/client";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set your password",
  robots: { index: false, follow: false },
};

type Peek =
  | { status: "valid"; name: string; roleLabel: string; churchName: string | null }
  | { status: "expired" | "used" | "revoked" | "invalid" };

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? raw[0] : raw;

  let peek: Peek | null = null;
  if (token) {
    try {
      peek = (
        await apiPost<Peek>("/auth/invitation", { token }, { skipRefresh: true })
      ).data;
    } catch {
      peek = { status: "invalid" };
    }
  }

  const invalidCopy =
    peek?.status === "expired"
      ? "This invitation has expired. Ask an administrator to send a new one."
      : peek?.status === "used"
        ? "This invitation has already been used. Sign in, or ask for a new link."
        : peek?.status === "revoked"
          ? "This invitation was cancelled. Ask an administrator to send a new one."
          : "This invitation link is incomplete or not valid.";

  return (
    <div className="flex min-h-dvh min-h-screen flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10">
      <Link href="/" className="w-fit min-w-0 rounded" aria-label="Hallelujah home">
        <BrandMark size="md" className="lg:hidden" />
        <BrandMark size="lg" className="hidden lg:inline-flex" />
      </Link>

      <main id="main-content" className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Set your password
          </h1>
          {peek?.status === "valid" ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Welcome, {peek.name}. You were invited as {peek.roleLabel}
              {peek.churchName ? ` for ${peek.churchName}` : ""}. Choose a password, then sign in.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Use at least 10 characters. After you save it, sign in with your username.
            </p>
          )}
          <div className="mt-8">
            {token && peek?.status === "valid" ? (
              <SetPasswordForm
                token={token}
                churchName={peek.churchName}
                roleLabel={peek.roleLabel}
              />
            ) : (
              <p
                role="alert"
                className="rounded-md border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
              >
                {invalidCopy}
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
