"use server";

import { revalidatePath } from "next/cache";
import { createPrayerType, setPrayerTypeActive, updatePrayerType } from "@/lib/services";
import { ApiError, userMessage } from "@/lib/api/errors";
import { getSession } from "@/lib/session";

export interface PrayerTypeState {
  status: "idle" | "error" | "success";
  message?: string;
}

export async function createPrayerTypeAction(
  _prev: PrayerTypeState,
  formData: FormData,
): Promise<PrayerTypeState> {
  const session = await getSession();
  if (session?.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only a platform administrator can change the catalogue." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? 15);

  if (!name) return { status: "error", message: "Enter a name for this prayer type." };
  if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(code)) {
    return { status: "error", message: "Use an uppercase code like NOVENA or HEALTH_AND_HEALING." };
  }
  if (!description) return { status: "error", message: "Enter a short description." };
  if (!Number.isInteger(amount) || amount < 0) {
    return { status: "error", message: "Enter a whole-rupee default offering." };
  }

  try {
    await createPrayerType({
      code,
      name,
      description,
      suggestedAmount: amount,
      durationMinutes: Number.isInteger(durationMinutes) && durationMinutes > 0 ? durationMinutes : 15,
    });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }

  revalidatePath("/super-admin/prayer-types");
  return { status: "success", message: `${name} has been added to the catalogue.` };
}

export async function togglePrayerTypeAction(
  id: string,
  isActive: boolean,
): Promise<PrayerTypeState> {
  const session = await getSession();
  if (session?.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only a platform administrator can change the catalogue." };
  }
  try {
    await setPrayerTypeActive(id, isActive);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/super-admin/prayer-types");
  return {
    status: "success",
    message: isActive ? "Prayer type activated." : "Prayer type deactivated.",
  };
}

export async function updatePrayerTypeAction(
  _prev: PrayerTypeState,
  formData: FormData,
): Promise<PrayerTypeState> {
  const session = await getSession();
  if (session?.currentRole !== "SUPER_ADMIN") {
    return { status: "error", message: "Only a platform administrator can change the catalogue." };
  }
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? "");
  if (!id) return { status: "error", message: "Missing prayer type." };
  try {
    await updatePrayerType(id, {
      name: name || undefined,
      description: description || undefined,
      suggestedAmount: Number.isInteger(amount) ? amount : undefined,
    });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
  revalidatePath("/super-admin/prayer-types");
  return { status: "success", message: "Prayer type updated." };
}
