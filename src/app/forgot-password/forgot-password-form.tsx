"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { recoveryResetAction, type ResetState } from "@/app/actions/auth";
import { SaveRecoveryCodeDialog } from "@/components/auth/save-recovery-code-dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/lib/feedback/toast";

const initialState: ResetState = { status: "idle" };

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [username, setUsername] = React.useState("");
  const [recoveryCode, setRecoveryCode] = React.useState("");
  const [issuedCode, setIssuedCode] = React.useState<string | null>(null);
  const [state, formAction, pending] = useActionState(recoveryResetAction, initialState);

  React.useEffect(() => {
    if (state.status !== "success") return;
    if (state.recoveryCode) {
      setIssuedCode(state.recoveryCode);
      return;
    }
    toast.success({
      title: "Password reset successfully",
      message: "Sign in with your new password.",
    });
    router.replace("/login");
  }, [state, router]);

  const handleSaved = () => {
    setIssuedCode(null);
    toast.success({
      title: "Password reset successfully",
      message: "Sign in with your new password. Keep the new recovery code somewhere safe.",
    });
    router.replace("/login");
  };

  if (issuedCode) {
    return <SaveRecoveryCodeDialog code={issuedCode} onSaved={handleSaved} />;
  }

  if (step === 1) {
    return (
      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!username.trim()) return;
          if (!recoveryCode.trim()) return;
          setStep(2);
        }}
      >
        <Field id="username" label="Username" required>
          {(aria) => (
            <Input
              {...aria}
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="fr.joseph"
            />
          )}
        </Field>
        <Field
          id="recoveryCode"
          label="Recovery Code"
          required
          description="The code shown once after you first set your password."
        >
          {(aria) => (
            <Input
              {...aria}
              name="recoveryCode"
              autoComplete="off"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="font-mono tracking-wide uppercase"
            />
          )}
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={!username.trim() || !recoveryCode.trim()}>
          Continue
        </Button>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="recoveryCode" value={recoveryCode} />

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive-muted px-3 py-2 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      <Field id="password" label="New password" required description="At least 10 characters.">
        {(aria) => (
          <PasswordInput
            {...aria}
            name="password"
            autoComplete="new-password"
            minLength={10}
            autoFocus
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
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => setStep(1)}
          disabled={pending}
        >
          Back
        </Button>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
          {pending ? "Resetting…" : "Reset Password"}
        </Button>
      </div>
    </form>
  );
}
