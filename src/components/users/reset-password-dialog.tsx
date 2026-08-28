"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { resetUserPasswordAction } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { notifyResult } from "@/lib/feedback/toast";

export function ResetPasswordDialog({
  open,
  onClose,
  userId,
  userName,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setPassword("");
      setConfirmPassword("");
    }
  }, [open]);

  const submit = () => {
    if (pending) return;
    if (password.length < 10) {
      setError("Use at least 10 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }
    startTransition(async () => {
      const result = await resetUserPasswordAction(userId, password, confirmPassword);
      notifyResult(result, {
        successTitle: "Password reset successfully",
        errorTitle: "Unable to reset password",
        successMessage: "They must sign in with this password and choose a new one.",
      });
      if (result.status === "success") {
        onClose();
        router.refresh();
      } else {
        setError(result.message ?? "Unable to reset password.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reset Password"
      description="They will sign in with this password and must choose a new one before using the workspace. Existing sessions are signed out."
      size="sm"
      dismissible={!pending}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={submit} disabled={pending}>
            {pending ? "Resetting…" : "Reset Password"}
          </Button>
        </>
      }
    >
      <dl className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">User</dt>
          <dd className="min-w-0 text-right font-medium text-foreground">{userName}</dd>
        </div>
        {userEmail ? (
          <div className="mt-1.5 flex justify-between gap-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="min-w-0 break-all text-right text-foreground">{userEmail}</dd>
          </div>
        ) : null}
      </dl>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/25 bg-destructive-muted px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <Field id={`reset-password-${userId}`} label="New Password" required>
        {(aria) => (
          <PasswordInput
            {...aria}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={10}
          />
        )}
      </Field>
      <Field id={`reset-confirm-${userId}`} label="Confirm Password" required>
        {(aria) => (
          <PasswordInput
            {...aria}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={10}
          />
        )}
      </Field>
    </Dialog>
  );
}
