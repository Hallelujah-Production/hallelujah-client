"use client";

import * as React from "react";
import { toast } from "@/lib/feedback/toast";

/**
 * Fires a toast once when a Server Action state flips to success/error.
 * Field-level errors stay inline — pass `hasFieldErrors` to skip the error toast.
 */
export function useActionFeedback(
  state: { status?: string; message?: string; error?: string },
  options: {
    successTitle: string;
    errorTitle?: string;
    hasFieldErrors?: boolean;
    silentSuccess?: boolean;
    silentError?: boolean;
  },
): void {
  const seen = React.useRef("");
  const successTitle = options.successTitle;
  const errorTitle = options.errorTitle ?? "Something went wrong";
  const hasFieldErrors = Boolean(options.hasFieldErrors);
  const silentSuccess = Boolean(options.silentSuccess);
  const silentError = Boolean(options.silentError);

  React.useEffect(() => {
    const status = state.status ?? (state.error ? "error" : "idle");
    const message = state.message ?? state.error;
    const key = `${status}:${message ?? ""}`;
    if (status === "idle" || key === seen.current) return;
    seen.current = key;

    if (status === "success" && !silentSuccess) {
      toast.success({ title: successTitle, message });
    }
    if (status === "error" && !silentError && !hasFieldErrors && message) {
      toast.error({ title: errorTitle, message });
    }
  }, [
    state.status,
    state.message,
    state.error,
    successTitle,
    errorTitle,
    hasFieldErrors,
    silentSuccess,
    silentError,
  ]);
}
