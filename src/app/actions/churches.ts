"use server";

import { revalidatePath } from "next/cache";
import { assignChurchAdmin, createChurch, deleteChurch, setChurchActive, unassignChurchAdmin } from "@/lib/services";
import { ApiError, userMessage } from "@/lib/api/errors";
import { getSession } from "@/lib/session";
import { slugify } from "@/lib/utils";

export interface ChurchFormState {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Record<string, string>;
  slug?: string;
}

export async function createChurchAction(
  _prev: ChurchFormState,
  formData: FormData,
): Promise<ChurchFormState> {
  const session = await getSession();
  if (session?.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only a platform administrator can create a church." };
  }

  const errors: Record<string, string> = {};
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const adminUserId = String(formData.get("adminUserId") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const adminConfirmPassword = String(formData.get("adminConfirmPassword") ?? "");

  if (!name) errors.name = "Enter the full name of the church.";
  if (!city) errors.city = "Enter the town or city the parish serves.";
  if (!state) errors.state = "Enter the state.";
  if (!addressLine1) errors.addressLine1 = "Enter the street address printed on receipts.";
  if (!/^[0-9]{6}$/.test(postalCode)) errors.postalCode = "Enter a valid 6-digit PIN code.";
  if (!phone) errors.phone = "Enter the parish office phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid parish email address.";
  }
  if (!adminUserId) {
    if (!adminName) errors.adminName = "Name the person who will administer this church.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      errors.adminEmail = "Enter a valid email address for the administrator account.";
    }
    if (adminPassword.length < 10) {
      errors.adminPassword = "Use at least 10 characters.";
    }
    if (adminPassword !== adminConfirmPassword) {
      errors.adminConfirmPassword = "The two passwords do not match.";
    }
  }

  if (Object.keys(errors).length) {
    return { status: "error", errors, message: "Please correct the highlighted fields." };
  }

  try {
    const { church } = await createChurch({
      name,
      city,
      state,
      addressLine1,
      postalCode,
      phone,
      email,
      tagline: String(formData.get("tagline") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      adminUserId: adminUserId || undefined,
      adminName: adminUserId ? undefined : adminName,
      adminEmail: adminUserId ? undefined : adminEmail,
      adminPhone: String(formData.get("adminPhone") ?? "").trim() || undefined,
      adminPassword: adminUserId ? undefined : adminPassword,
      adminConfirmPassword: adminUserId ? undefined : adminConfirmPassword,
    });

    revalidatePath("/super-admin/churches");
    revalidatePath("/super-admin");
    revalidatePath("/churches");

    const adminLabel = adminUserId ? "the selected administrator" : adminName;
    const adminNote = adminUserId
      ? ` They can open this parish from My Churches.`
      : ` ${adminName} can sign in with the password you set, then must choose a new one.`;

    return {
      status: "success",
      slug: church.slug || slugify(name),
      message: `${church.name} has been created with ${adminLabel} as its administrator.${adminNote}`,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        status: "error",
        errors: error.fields,
        message: userMessage(error),
      };
    }
    throw error;
  }
}

export async function setChurchActiveAction(
  churchId: string,
  isActive: boolean,
): Promise<{ status: "success" | "error"; message: string }> {
  const session = await getSession();
  if (session?.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only a platform administrator can do that." };
  }

  try {
    await setChurchActive(churchId, isActive);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/super-admin/churches");
  revalidatePath("/super-admin");
  revalidatePath("/churches");

  return {
    status: "success",
    message: isActive
      ? "Church activated. Its public page is live again."
      : "Church deactivated. Its public page and workspace are closed.",
  };
}

export async function deleteChurchAction(
  churchId: string,
): Promise<{ status: "success" | "error"; message: string }> {
  const session = await getSession();
  if (session?.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only a platform administrator can do that." };
  }

  try {
    await deleteChurch(churchId);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/super-admin/churches");
  revalidatePath("/super-admin");
  revalidatePath("/churches");

  return {
    status: "success",
    message: "The church and its records have been deleted.",
  };
}

export async function assignChurchAdminAction(
  churchId: string,
  userId: string,
): Promise<{ status: "success" | "error"; message: string }> {
  const session = await getSession();
  if (session?.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only a platform administrator can do that." };
  }
  try {
    await assignChurchAdmin(churchId, userId);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/super-admin/churches");
  revalidatePath("/super-admin");
  return { status: "success", message: "Administrator assigned to this church." };
}

export async function unassignChurchAdminAction(
  churchId: string,
  userId: string,
): Promise<{ status: "success" | "error"; message: string }> {
  const session = await getSession();
  if (session?.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only a platform administrator can do that." };
  }
  try {
    await unassignChurchAdmin(churchId, userId);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/super-admin/churches");
  revalidatePath("/super-admin");
  return { status: "success", message: "Administrator assignment removed." };
}
