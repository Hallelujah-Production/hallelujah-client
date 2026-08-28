"use server";

import { revalidatePath } from "next/cache";
import { updateChurch } from "@/lib/services";
import { ApiError, userMessage } from "@/lib/api/errors";
import { getSession } from "@/lib/session";

export interface SettingsState {
  status: "idle" | "error" | "success";
  message?: string;
}

export async function saveChurchProfileAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await getSession();
  if (!session?.currentChurch || session.currentRole !== "CHURCH_ADMIN") {
    return { status: "error", message: "You are not able to change these settings." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name) return { status: "error", message: "The church name cannot be empty." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a valid parish email address." };
  }

  const labels = formData.getAll("serviceTimeLabel").map((value) => String(value).trim());
  const times = formData.getAll("serviceTimeTime").map((value) => String(value).trim());
  const serviceTimes: { label: string; time: string }[] = [];
  const count = Math.min(labels.length, times.length, 20);
  for (let i = 0; i < count; i++) {
    if (!labels[i] && !times[i]) continue;
    if (!labels[i] || !times[i]) {
      return { status: "error", message: "Each service time needs a label and a time." };
    }
    serviceTimes.push({ label: labels[i], time: times[i] });
  }

  try {
    await updateChurch(session.currentChurch.id, {
      name,
      tagline: String(formData.get("tagline") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      phone,
      email,
      website: String(formData.get("website") ?? "").trim() || undefined,
      addressLine1: String(formData.get("addressLine1") ?? "").trim(),
      addressLine2: String(formData.get("addressLine2") ?? "").trim() || undefined,
      city: String(formData.get("city") ?? "").trim(),
      state: String(formData.get("state") ?? "").trim(),
      postalCode: String(formData.get("postalCode") ?? "").trim(),
      serviceTimes,
    });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }

  const slug = session.currentChurch.slug;
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/intentions/new");
  if (slug) {
    revalidatePath(`/church/${slug}`);
    revalidatePath(`/church/${slug}/prayer`);
  }

  return {
    status: "success",
    message: "Church profile saved.",
  };
}

export async function saveChurchPricingAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await getSession();
  if (!session?.currentChurch || session.currentRole !== "CHURCH_ADMIN") {
    return { status: "error", message: "You are not able to change these settings." };
  }

  const prayerTypeId = String(formData.get("prayerTypeId") ?? "");
  const rupees = Number(formData.get("amount") ?? "");
  if (!prayerTypeId) return { status: "error", message: "Choose a prayer type." };
  if (!Number.isInteger(rupees) || rupees < 0) {
    return { status: "error", message: "Enter a whole-rupee offering amount." };
  }

  try {
    const { updateChurchPrayerPricing } = await import("@/lib/services");
    const { rupeesToPaise } = await import("@/lib/api/money");
    const amountPaise = rupeesToPaise(rupees);
    await updateChurchPrayerPricing(prayerTypeId, { amountPaise });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }

  revalidatePath("/settings");
  revalidatePath("/intentions/new");
  return {
    status: "success",
    message: `Offering updated to ₹${rupees}. New intentions will use this amount.`,
  };
}
