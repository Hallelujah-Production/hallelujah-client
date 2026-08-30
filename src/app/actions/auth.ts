"use server";

import { cookies } from "next/headers";
import { apiPost } from "@/lib/api/client";
import { applySetCookieHeaders } from "@/lib/api/cookies";
import { ApiError, userMessage } from "@/lib/api/errors";
import { landingRouteForRole } from "@/lib/session";
import type { Role } from "@/lib/types";

export interface LoginState {
  error?: string;
  username?: string;
  /** Set on success so the client can navigate. Server `redirect()` waits for the destination RSC. */
  next?: string;
}

export async function signInAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username) return { error: "Enter the username for your church account.", username };
  if (!password) return { error: "Enter your password.", username };

  const started = Date.now();
  try {
    const { data } = await apiPost<{
      user: { role: Role };
      mustChangePassword?: boolean;
    }>("/auth/login", { username, password }, { skipRefresh: true });

    if (process.env.NODE_ENV === "development") {
      console.info(`[auth] login action ${Date.now() - started}ms next=${landingRouteForRole(data.user.role)}`);
    }

    const next = data.mustChangePassword ? "/change-password" : landingRouteForRole(data.user.role);
    return { next, username };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: userMessage(error, "Invalid username or password."), username };
    }
    throw error;
  }
}

export async function signOutAction(): Promise<{ ok: true }> {
  try {
    await apiPost("/auth/logout", {}, { skipRefresh: true });
  } catch {
    // Still clear local cookies if the API is unreachable.
  }
  const store = await cookies();
  store.delete("gundala_at");
  store.delete("gundala_rt");
  store.delete("gundala_csrf");
  return { ok: true };
}

export interface ForgotState {
  status: "idle" | "error" | "success";
  message?: string;
}

export async function forgotPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!username) return { status: "error", message: "Enter the username for your account." };
  try {
    const { message } = await apiPost<{ ok: true }>("/auth/forgot-password", { username }, {
      skipRefresh: true,
    });
    return {
      status: "success",
      message: message ?? "If that username has an account, follow the next step with your recovery code.",
    };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export interface ResetState {
  status: "idle" | "error" | "success";
  message?: string;
  recoveryCode?: string;
}

export async function recoveryResetAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const recoveryCode = String(formData.get("recoveryCode") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!username) return { status: "error", message: "Enter the username for your account." };
  if (!recoveryCode) return { status: "error", message: "Enter your recovery code." };
  if (password.length < 10) {
    return { status: "error", message: "Use at least 10 characters." };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "The two passwords do not match." };
  }
  try {
    const { data, message } = await apiPost<{ recoveryCode: string }>(
      "/auth/recovery/reset",
      { username, recoveryCode, password, confirmPassword },
      { skipRefresh: true },
    );
    return {
      status: "success",
      message: message ?? "Password reset successfully.",
      recoveryCode: data.recoveryCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "INVALID_CREDENTIALS") {
        return { status: "error", message: "Those details do not match." };
      }
      return {
        status: "error",
        message: userMessage(error, "Those details do not match."),
      };
    }
    throw error;
  }
}

export async function setPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!token) return { status: "error", message: "This invitation link is incomplete." };
  if (password.length < 10) {
    return { status: "error", message: "Use at least 10 characters." };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "The two passwords do not match." };
  }
  try {
    await apiPost<{ ok: true }>(
      "/auth/set-password",
      { token, password, confirmPassword },
      { skipRefresh: true },
    );
    return {
      status: "success",
      message: "Password created successfully. Sign in with your username and this password.",
    };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!token) return { status: "error", message: "This reset link is incomplete." };
  if (password.length < 10) {
    return { status: "error", message: "Use at least 10 characters." };
  }
  try {
    const { message } = await apiPost<{ ok: true }>(
      "/auth/reset-password",
      { token, password },
      { skipRefresh: true },
    );
    return {
      status: "success",
      message: message ?? "Your password has been changed. Sign in with your new password.",
    };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function changePasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!currentPassword) return { status: "error", message: "Enter your current password." };
  if (newPassword.length < 10) {
    return { status: "error", message: "Use at least 10 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: "The two passwords do not match." };
  }
  try {
    const { data, message } = await apiPost<{ recoveryCode?: string }>("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return {
      status: "success",
      message: message ?? "Your password has been changed on every device.",
      recoveryCode: data.recoveryCode,
    };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function switchWorkspaceAction(
  churchId: string,
): Promise<{ status: "success" | "error"; message: string }> {
  if (!churchId) return { status: "error", message: "Choose a church." };
  try {
    await apiPost("/auth/workspace", { churchId });
    return { status: "success", message: "Workspace switched." };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

/** Used only so the unused import is available if login needs manual cookie copy. */
export async function copyAuthCookies(headers: Headers): Promise<void> {
  const store = await cookies();
  applySetCookieHeaders(store, headers);
}
