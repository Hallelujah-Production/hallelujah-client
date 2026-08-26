"use server";

import { notFound, redirect } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api/client";
import { ApiError, userMessage } from "@/lib/api/errors";

export interface SetupState {
  error?: string;
  fields?: Record<string, string>;
  values?: {
    name?: string;
    email?: string;
  };
}

function bffSetupSecret(): string {
  return (process.env.SETUP_SECRET ?? "").trim();
}

export async function assertSetupOpen(): Promise<void> {
  if (bffSetupSecret().length < 32) notFound();
  try {
    await apiGet<{ available: true }>("/setup/super-admin", { skipRefresh: true });
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
}

export async function createSuperAdminAction(
  _prev: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const values = { name, email };
  const setupSecret = bffSetupSecret();

  const fields: Record<string, string> = {};
  if (!name) fields.name = "Enter your full name.";
  if (!email) fields.email = "Enter a valid email address.";
  if (password.length < 10) fields.password = "Use at least 10 characters.";
  if (password !== confirmPassword) fields.confirmPassword = "Passwords do not match.";
  if (Object.keys(fields).length) {
    return { error: "Some of the details provided are not valid.", fields, values };
  }
  if (setupSecret.length < 32) notFound();

  try {
    await apiPost(
      "/setup/super-admin",
      { name, email, password, confirmPassword, setupSecret },
      { skipRefresh: true },
    );
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    if (error instanceof ApiError && error.isValidation) {
      return {
        error: userMessage(error, "Some of the details provided are not valid."),
        fields: error.fields,
        values,
      };
    }
    if (error instanceof ApiError) {
      return { error: userMessage(error), values };
    }
    throw error;
  }

  redirect("/login?created=1");
}
