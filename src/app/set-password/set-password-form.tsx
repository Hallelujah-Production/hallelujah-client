"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { setPasswordAction, type ResetState } from "@/app/actions/auth";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: ResetState = { status: "idle" };

export function SetPasswordForm({
  token,
  churchName,
  roleLabel,
}: {
  token: string;
  churchName?: string | null;
  roleLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(setPasswordAction, initialState);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="space-y-5 rounded-lg border border-success/25 bg-success-muted px-5 py-6 text-center"
      >
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Password created successfully
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {churchName
              ? `Your ${roleLabel ?? "account"} password for ${churchName} is ready. Sign in with your email and this password to open the parish workspace.`
              : "Your password is ready. Sign in with your email and this password."}
          </p>
        </div>
        <ButtonLink href="/login" size="lg" className="w-full">
          Sign in now
        </ButtonLink>
      </div>
    );
  }

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

      <Field
        id="password"
        label="Password"
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
      <Field id="confirmPassword" label="Confirm password" required>
        {(aria) => (
          <PasswordInput
            {...aria}
            name="confirmPassword"
            autoComplete="new-password"
            minLength={10}
          />
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Set password"}
      </Button>
    </form>
  );
}
