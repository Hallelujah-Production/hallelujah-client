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
  prayerTypeName?: string;
  personName?: string;
  prayerFor?: string;
  staffName?: string;
  amount?: number;
  receiptId?: string;
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

export interface ActionState {
  status: "idle" | "error" | "success";
  message?: string;
  startedAt?: string;
  completedAt?: string;
}

function actionError(error: unknown, fallback: string): ActionState {
  if (error instanceof ApiError && (error.isUnauthorized || error.isForbidden)) {
    return { status: "error", message: fallback };
  }
  if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
  throw error;
}

export async function assignIntentionAction(
  intentionId: string,
  staffUserId: string,
): Promise<ActionState> {
  try {
    const result = await assignIntention("", intentionId, staffUserId, "");
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
    if (error instanceof ApiError && (error.isUnauthorized || error.isForbidden)) {
      return { status: "error", message: "You are not able to assign this prayer." };
    }
    if (error instanceof ApiError) return { status: "error", message: userMessage(error) };
    throw error;
  }
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
  const mobile = String(formData.get("customerMobile") ?? "").trim();

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
      ...(mobile ? { mobile } : {}),
      email: String(formData.get("customerEmail") ?? "") || undefined,
      addressLine: String(formData.get("customerAddress") ?? "") || undefined,
    },
    payment: {
      amount: Number(formData.get("amount") ?? 0),
      method: (String(formData.get("method") ?? "CASH") || "CASH") as PaymentMethod,
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
    prayerTypeName: result.intention.prayerType.name,
    personName: result.intention.requestedBy || result.intention.customer.name,
    prayerFor: result.intention.prayerFor,
    staffName: result.intention.assignedStaff?.name,
    amount: result.intention.amount,
    receiptId: result.intention.receiptId,
  };
}

export async function startIntentionAction(intentionId: string): Promise<ActionState> {
  try {
    const result = await startIntention("", intentionId);
    if (!result) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath(`/intentions/${intentionId}`);
    revalidatePath(`/my-prayers/${intentionId}`);
    revalidatePath("/my-prayers");
    return { status: "success", message: "Prayer started." };
  } catch (error) {
    return actionError(error, "You are not able to start this prayer.");
  }
}

export async function completeIntentionAction(intentionId: string): Promise<ActionState> {
  try {
    const result = await completeIntention("", intentionId, "");
    if (!result) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath("/intentions", "layout");
    revalidatePath("/my-prayers", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/completed");
    revalidatePath("/upcoming");
    revalidatePath("/my-churches");
    revalidatePath("/super-admin/my-churches");
    revalidatePath("/super-admin/churches", "layout");
    revalidatePath(`/intentions/${intentionId}`);
    revalidatePath(`/my-prayers/${intentionId}`);
    return {
      status: "success",
      message: "Prayer marked as completed.",
      startedAt: result.startedAt,
      completedAt: result.completedAt,
    };
  } catch (error) {
    return actionError(error, "You are not able to complete this prayer.");
  }
}

export async function cancelIntentionAction(
  intentionId: string,
  reason: string,
): Promise<ActionState> {
  try {
    const result = await cancelIntention("", intentionId, reason);
    if (!result) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath(`/intentions/${intentionId}`);
    revalidatePath("/intentions");
    revalidatePath("/dashboard");
    return { status: "success", message: "Intention cancelled." };
  } catch (error) {
    return actionError(error, "You are not able to cancel this intention.");
  }
}

export async function updateIntentionAction(
  intentionId: string,
  formData: FormData,
): Promise<ActionState> {
  try {
    const result = await updateIntention("", intentionId, {
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
    return actionError(error, "You are not able to update this intention.");
  }
}

export async function deleteIntentionAction(intentionId: string): Promise<ActionState> {
  try {
    const ok = await deleteIntention("", intentionId);
    if (!ok) return { status: "error", message: "That prayer intention could not be found." };
    revalidatePath("/intentions");
    revalidatePath("/dashboard");
    revalidatePath("/payments");
    revalidatePath("/notifications");
    revalidatePath("/receipts");
    revalidatePath("/my-prayers");
    return { status: "success", message: "Intention deleted." };
  } catch (error) {
    return actionError(error, "You are not able to delete this intention.");
  }
}

export async function verifyPaymentAction(paymentId: string): Promise<ActionState> {
  try {
    const { verifyPayment } = await import("@/lib/services");
    const result = await verifyPayment("", paymentId, "");
    if (!result) return { status: "error", message: "That payment could not be found." };
    revalidatePath(`/payments/${paymentId}`);
    revalidatePath("/payments");
    revalidatePath("/intentions");
    revalidatePath(`/intentions/${result.intentionId}`);
    revalidatePath("/dashboard");
    revalidatePath("/receipts");
    return { status: "success", message: "Payment verified. An official receipt has been issued." };
  } catch (error) {
    return actionError(error, "Only a church administrator can verify payments.");
  }
}

export async function rejectPaymentAction(
  paymentId: string,
  reason: string,
): Promise<ActionState> {
  try {
    const { rejectPayment } = await import("@/lib/services");
    const result = await rejectPayment("", paymentId, "", reason);
    if (!result) return { status: "error", message: "That payment could not be found." };
    revalidatePath(`/payments/${paymentId}`);
    revalidatePath("/payments");
    revalidatePath("/intentions");
    revalidatePath(`/intentions/${result.intentionId}`);
    revalidatePath("/dashboard");
    return { status: "success", message: "Payment rejected." };
  } catch (error) {
    return actionError(error, "Only a church administrator can reject payments.");
  }
}
