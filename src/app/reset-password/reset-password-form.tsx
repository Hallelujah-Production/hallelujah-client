"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { resetPasswordAction, type ResetState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: ResetState = { status: "idle" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <div
          role="status"
          className="space-y-3 rounded-md border border-success/25 bg-success-muted px-4 py-3 text-sm text-success"
        >
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
          <Link href="/login" className="inline-block font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      ) : null}

      <Field
        id="password"
        label="New password"
        required
        description="At least 10 characters."
      >
        {(aria) => (
          <PasswordInput
            {...aria}
            name="password"
            autoComplete="new-password"
            autoFocus
            minLength={10}
          />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending || state.status === "success"}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
