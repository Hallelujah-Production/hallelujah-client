"use server";

import { revalidatePath } from "next/cache";
import {
  assignIntention,
  cancelIntention,
  completeIntention,
  createIntention,
  deleteIntention,
  startIntention,
  updateIntention,
  type FieldErrors,
} from "@/lib/services";
import { ApiError, userMessage } from "@/lib/api/errors";
import { apiPost } from "@/lib/api/client";
import { getSession } from "@/lib/session";
import type { PaymentMethod } from "@/lib/types";

export interface SubmitIntentionState {
  status: "idle" | "error" | "success";
  errors?: FieldErrors;
  reference?: string;
  intentionId?: string;
  churchName?: string;
}

export async function submitIntentionAction(
  _prev: SubmitIntentionState,
  formData: FormData,
): Promise<SubmitIntentionState> {
  const result = await createIntention({
    churchId: String(formData.get("churchId") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    prayerTypeId: String(formData.get("prayerTypeId") ?? ""),
    prayerFor: String(formData.get("prayerFor") ?? ""),
    requestedBy: String(formData.get("customerName") ?? ""),
    prayerDate: String(formData.get("prayerDate") ?? ""),
    preferredTime: String(formData.get("preferredTime") ?? "") || undefined,
    message: String(formData.get("message") ?? "") || undefined,
    customer: {
      name: String(formData.get("customerName") ?? ""),
      mobile: String(formData.get("customerMobile") ?? ""),
      email: String(formData.get("customerEmail") ?? "") || undefined,
      addressLine: String(formData.get("customerAddress") ?? "") || undefined,
    },
    source: "PUBLIC",
  });

  if (!result.ok) {
    return { status: "error", errors: result.errors };
  }

  return {
    status: "success",
    reference: result.intention.reference,
    intentionId: result.intention.id,
  };
}

async function requireChurchActor(roles: ("CHURCH_ADMIN" | "CHURCH_STAFF")[]) {
  const session = await getSession();
  if (!session?.currentChurch) return null;
  if (!roles.includes(session.currentRole as "CHURCH_ADMIN" | "CHURCH_STAFF")) return null;
  return { churchId: session.currentChurch.id, userId: session.currentUser.id };
}

export interface ActionState {
  status: "idle" | "error" | "success";
  message?: string;
  startedAt?: string;
  completedAt?: string;
}

export async function createIntentionAction(
  _prev: SubmitIntentionState,
  formData: FormData,
): Promise<SubmitIntentionState> {
  const session = await getSession();
  if (!session?.currentChurch || session.currentRole !== "CHURCH_ADMIN") {
    return { status: "error", errors: { form: "Your session has expired. Sign in again." } };
  }

  const requestedChurchId = String(formData.get("churchId") ?? "").trim();
  const allotted = [session.currentChurch, ...session.assignedChurches].filter(
    (parish, index, list) => parish && list.findIndex((row) => row.id === parish.id) === index,
  );
  const destination = allotted.find((parish) => parish.id === requestedChurchId);
  if (!destination) {
    return {
      status: "error",
      errors: { form: "Choose one of the churches assigned to you." },
    };
  }

  if (destination.id !== session.currentChurch.id) {
    try {
      await apiPost("/auth/workspace", { churchId: destination.id });
    } catch (error) {
      if (error instanceof ApiError) {
        return { status: "error", errors: { form: userMessage(error) } };
      }
      throw error;
    }
  }

  const proof = formData.get("proof");
  const proofFile = proof instanceof File && proof.size > 0 ? proof : null;

  const result = await createIntention({
    churchId: destination.id,
    prayerTypeId: String(formData.get("prayerTypeId") ?? ""),
    prayerFor: String(formData.get("prayerFor") ?? ""),
    requestedBy: String(formData.get("customerName") ?? ""),
    prayerDate: String(formData.get("prayerDate") ?? ""),
    preferredTime: String(formData.get("preferredTime") ?? "") || undefined,
    message: String(formData.get("message") ?? "") || undefined,
    customer: {
      name: String(formData.get("customerName") ?? ""),
      mobile: String(formData.get("customerMobile") ?? ""),
      email: String(formData.get("customerEmail") ?? "") || undefined,
      addressLine: String(formData.get("customerAddress") ?? "") || undefined,
    },
    payment: {
      amount: Number(formData.get("amount") ?? 0),
      method: String(formData.get("method") ?? "CASH") as PaymentMethod,
      provider: String(formData.get("provider") ?? "") || undefined,
      transactionId: String(formData.get("transactionId") ?? "") || undefined,
      notes: String(formData.get("paymentNotes") ?? "") || undefined,
    },
    proofFile,
    source: "STAFF",
    actorUserId: session.currentUser.id,
    assignedStaffUserId: String(formData.get("assignedStaffUserId") ?? "").trim() || undefined,
  });

  if (!result.ok) return { status: "error", errors: result.errors };

  revalidatePath("/intentions");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  revalidatePath("/receipts");
  revalidatePath("/customers");

  return {
    status: "success",
    reference: result.intention.reference,
    intentionId: result.intention.id,
    churchName: destination.name,
  };
}

export async function assignIntentionAction(
  intentionId: string,
  staffUserId: string,
): Promise<ActionState> {
  const actor = await requireChurchActor(["CHURCH_ADMIN"]);
  if (!actor) return { status: "error", message: "You are not able to assign this prayer." };

  try {
    const result = await assignIntention(actor.churchId, intentionId, staffUserId, actor.userId);
    if (!result) {
      return {
        status: "error",
        message: "Switch to the church this intention belongs to, then assign prayer staff from that parish.",
      };
    }
    revalidatePath(`/intentions/${intentionId}`);
    revalidatePath("/intentions");
    revalidatePath("/dashboard");
    revalidatePath("/my-prayers");
    revalidatePath("/upcoming");
    revalidatePath("/completed");
    return { status: "success", message: `Assigned to ${result.assignedStaff?.name}.` };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function startIntentionAction(intentionId: string): Promise<ActionState> {
  const actor = await requireChurchActor(["CHURCH_ADMIN", "CHURCH_STAFF"]);
  if (!actor) return { status: "error", message: "You are not able to start this prayer." };
  try {
    const result = await startIntention(actor.churchId, intentionId);
    if (!result) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath(`/intentions/${intentionId}`);
    revalidatePath(`/my-prayers/${intentionId}`);
    revalidatePath("/my-prayers");
    return { status: "success", message: "Prayer started." };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function completeIntentionAction(intentionId: string): Promise<ActionState> {
  const actor = await requireChurchActor(["CHURCH_ADMIN", "CHURCH_STAFF"]);
  if (!actor) return { status: "error", message: "You are not able to complete this prayer." };

  try {
    const result = await completeIntention(actor.churchId, intentionId, actor.userId);
    if (!result) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath(`/intentions/${intentionId}`);
    revalidatePath(`/my-prayers/${intentionId}`);
    revalidatePath("/my-prayers");
    revalidatePath("/intentions");
    revalidatePath("/dashboard");
    revalidatePath("/completed");
    revalidatePath("/my-churches");
    revalidatePath("/super-admin/my-churches");
    return {
      status: "success",
      message: "Prayer marked as completed.",
      startedAt: result.startedAt,
      completedAt: result.completedAt,
    };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function cancelIntentionAction(
  intentionId: string,
  reason: string,
): Promise<ActionState> {
  const actor = await requireChurchActor(["CHURCH_ADMIN"]);
  if (!actor) return { status: "error", message: "You are not able to cancel this intention." };

  try {
    const result = await cancelIntention(actor.churchId, intentionId, reason);
    if (!result) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath(`/intentions/${intentionId}`);
    revalidatePath("/intentions");
    revalidatePath("/dashboard");
    return { status: "success", message: "Intention cancelled." };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function updateIntentionAction(
  intentionId: string,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireChurchActor(["CHURCH_ADMIN"]);
  if (!actor) return { status: "error", message: "You are not able to update this intention." };

  try {
    const result = await updateIntention(actor.churchId, intentionId, {
      prayerFor: String(formData.get("prayerFor") ?? ""),
      prayerDate: String(formData.get("prayerDate") ?? ""),
      preferredTime: String(formData.get("preferredTime") ?? "") || null,
      message: String(formData.get("message") ?? "") || null,
      requestedBy: String(formData.get("requestedBy") ?? "") || undefined,
    });
    if (!result) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath(`/intentions/${intentionId}`);
    revalidatePath("/intentions");
    revalidatePath("/dashboard");
    return { status: "success", message: "Intention updated." };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function deleteIntentionAction(intentionId: string): Promise<ActionState> {
  const actor = await requireChurchActor(["CHURCH_ADMIN"]);
  if (!actor) return { status: "error", message: "You are not able to delete this intention." };

  try {
    const ok = await deleteIntention(actor.churchId, intentionId);
    if (!ok) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath("/intentions");
    revalidatePath("/dashboard");
    revalidatePath("/payments");
    revalidatePath("/notifications");
    revalidatePath("/receipts");
    revalidatePath("/my-prayers");
    return { status: "success", message: "Intention deleted." };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function verifyPaymentAction(paymentId: string): Promise<ActionState> {
  const actor = await requireChurchActor(["CHURCH_ADMIN"]);
  if (!actor) return { status: "error", message: "Only a church administrator can verify payments." };

  try {
    const { verifyPayment } = await import("@/lib/services");
    const result = await verifyPayment(actor.churchId, paymentId, actor.userId);
    if (!result) return { status: "error", message: "That payment could not be found." };
    revalidatePath(`/payments/${paymentId}`);
    revalidatePath("/payments");
    revalidatePath("/intentions");
    revalidatePath(`/intentions/${result.intentionId}`);
    revalidatePath("/dashboard");
    revalidatePath("/receipts");
    return { status: "success", message: "Payment verified. An official receipt has been issued." };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}

export async function rejectPaymentAction(
  paymentId: string,
  reason: string,
): Promise<ActionState> {
  const actor = await requireChurchActor(["CHURCH_ADMIN"]);
  if (!actor) return { status: "error", message: "Only a church administrator can reject payments." };

  try {
    const { rejectPayment } = await import("@/lib/services");
    const result = await rejectPayment(actor.churchId, paymentId, actor.userId, reason);
    if (!result) return { status: "error", message: "That payment could not be found." };
    revalidatePath(`/payments/${paymentId}`);
    revalidatePath("/payments");
    revalidatePath("/intentions");
    revalidatePath(`/intentions/${result.intentionId}`);
    revalidatePath("/dashboard");
    return { status: "success", message: "Payment rejected." };
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
}
