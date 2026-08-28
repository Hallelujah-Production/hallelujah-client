"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { signInAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { authOverlay } from "@/lib/feedback/auth-overlay";
import { flashToast } from "@/lib/feedback/flash";

const initialState: LoginState = {};

const SIGNED_IN_TOAST = {
  tone: "success" as const,
  title: "Signed in successfully",
  message: "Welcome back. Your workspace is ready.",
};

export function LoginForm({ created = false }: { created?: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const busy = pending || Boolean(state.next);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    if (state.email) setEmail(state.email);
  }, [state.email]);

  React.useEffect(() => {
    if (pending) {
      authOverlay.begin("signin");
      return;
    }
    if (state.next) {
      flashToast(SIGNED_IN_TOAST);
      authOverlay.commit(state.next, SIGNED_IN_TOAST);
      if (process.env.NODE_ENV === "development") {
        console.info(`[auth] client replace ${state.next}`);
      }
      // Leave the Server Action transition before starting the route change.
      // Calling replace in the same turn as a cookie-setting action can leave
      // the App Router on /login even after /dashboard RSC has finished.
      const href = state.next;
      const start = window.setTimeout(() => {
        router.replace(href);
      }, 0);
      return () => window.clearTimeout(start);
    }
    if (state.error) authOverlay.abort();
  }, [pending, state.next, state.error, router]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {created && !state.error ? (
        <p
          role="status"
          className="rounded-md border border-primary/20 bg-primary-muted px-4 py-3 text-sm text-foreground"
        >
          Your Super Admin account is ready. Sign in with the email and password you just created.
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      ) : null}

      <Field id="email" label="Email address" required>
        {(aria) => (
          <Input
            {...aria}
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        )}
      </Field>

      <Field id="password" label="Password" required>
        {(aria) => (
          <div className="relative">
            <Input
              {...aria}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              suppressHydrationWarning
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </Field>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <label htmlFor="remember" className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            id="remember"
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
            suppressHydrationWarning
          />
          Keep me signed in
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in
          </span>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  );
}
