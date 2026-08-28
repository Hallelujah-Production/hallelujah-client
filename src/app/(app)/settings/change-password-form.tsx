"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { changePasswordAction, type ResetState } from "@/app/actions/auth";
import { SaveRecoveryCodeDialog } from "@/components/auth/save-recovery-code-dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { toast } from "@/lib/feedback/toast";

const initialState: ResetState = { status: "idle" };

export function ChangePasswordForm({
  redirectOnSuccess,
  leaveIfAlreadyChanged = false,
}: {
  redirectOnSuccess?: string;
  /** True when this URL is opened after the password is already set (GET). */
  leaveIfAlreadyChanged?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const [acknowledged, setAcknowledged] = useState(false);
  const openedAlreadyChanged = useRef(leaveIfAlreadyChanged);
  const visibleCode =
    state.status === "success" && state.recoveryCode && !acknowledged ? state.recoveryCode : null;

  useActionFeedback(state, {
    successTitle: "Password changed",
    silentError: true,
    silentSuccess: Boolean(state.recoveryCode),
  });

  useEffect(() => {
    if (visibleCode || !redirectOnSuccess) return;
    if (state.status === "success") {
      router.replace(redirectOnSuccess);
      router.refresh();
      return;
    }
    if (openedAlreadyChanged.current && state.status === "idle") {
      router.replace(redirectOnSuccess);
    }
  }, [visibleCode, state.status, redirectOnSuccess, router]);

  const handleSaved = () => {
    setAcknowledged(true);
    toast.success({
      title: "Password changed",
      message: "Your new password is in effect. Keep the recovery code somewhere safe.",
    });
  };

  return (
    <>
      {visibleCode ? <SaveRecoveryCodeDialog code={visibleCode} onSaved={handleSaved} /> : null}

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
            <PasswordInput
              {...aria}
              name="currentPassword"
              autoComplete="current-password"
            />
          )}
        </Field>

        <Field
          id="newPassword"
          label="New password"
          required
          description="At least 10 characters."
        >
          {(aria) => (
            <PasswordInput
              {...aria}
              name="newPassword"
              autoComplete="new-password"
              minLength={10}
            />
          )}
        </Field>

        <Field id="confirmPassword" label="Confirm new password" required>
          {(aria) => (
            <PasswordInput
              {...aria}
              name="confirmPassword"
              autoComplete="new-password"
              minLength={10}
            />
          )}
        </Field>

        <Button type="submit" size="sm" disabled={pending || Boolean(visibleCode)}>
          {pending ? "Saving…" : "Change password"}
        </Button>
      </form>
    </>
  );
}
