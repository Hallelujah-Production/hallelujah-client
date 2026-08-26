"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { changePasswordAction, type ResetState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useActionFeedback } from "@/hooks/use-action-feedback";

const initialState: ResetState = { status: "idle" };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  useActionFeedback(state, { successTitle: "Password changed", silentError: true });

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive-muted px-3 py-2 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      <Field id="currentPassword" label="Current password" required>
        {(aria) => (
          <Input
            {...aria}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
          />
        )}
      </Field>

      <Field
        id="newPassword"
        label="New password"
        required
        description="At least 10 characters. Sessions on other devices stay signed in until they expire."
      >
        {(aria) => (
          <Input
            {...aria}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={10}
          />
        )}
      </Field>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
