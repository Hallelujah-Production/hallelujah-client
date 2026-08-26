"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertTriangle, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { createSuperAdminAction, type SetupState } from "@/app/actions/setup";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { GoldCrown } from "./setup-ornaments";

const initialState: SetupState = {};

const fieldClass = "h-10 rounded-lg pl-10";

export function SetupForm() {
  const [state, formAction, pending] = useActionState(createSuperAdminAction, initialState);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <form action={formAction} className="space-y-2.5" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      ) : null}

      <Field id="name" label="Full name" required error={state.fields?.name}>
        {(aria) => (
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              {...aria}
              name="name"
              autoComplete="name"
              autoFocus
              defaultValue={state.values?.name ?? ""}
              placeholder="Your full name"
              className={fieldClass}
            />
          </div>
        )}
      </Field>

      <Field id="email" label="Email" required error={state.fields?.email}>
        {(aria) => (
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              {...aria}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.values?.email ?? ""}
              placeholder="you@example.com"
              className={fieldClass}
            />
          </div>
        )}
      </Field>

      <Field id="password" label="Password" required error={state.fields?.password}>
        {(aria) => (
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              {...aria}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${fieldClass} pr-11`}
              placeholder="At least 10 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              suppressHydrationWarning
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        )}
      </Field>

      <Field
        id="confirmPassword"
        label="Confirm password"
        required
        error={state.fields?.confirmPassword}
      >
        {(aria) => (
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              {...aria}
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              className={`${fieldClass} pr-11`}
              placeholder="Repeat your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              aria-pressed={showConfirm}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              suppressHydrationWarning
            >
              {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        )}
      </Field>

      <Button
        type="submit"
        size="lg"
        className="mt-1.5 h-10 w-full rounded-lg border-b-2 border-accent text-primary-foreground"
        disabled={pending}
      >
        <GoldCrown className="h-4 w-4 text-accent" />
        {pending ? "Creating Super Admin…" : "Create Super Admin"}
      </Button>
    </form>
  );
}
