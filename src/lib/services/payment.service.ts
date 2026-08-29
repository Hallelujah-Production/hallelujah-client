import "server-only";

import { apiGet, apiGetPaginated, apiPost } from "@/lib/api/client";
import { mapPaymentView } from "@/lib/api/adapters";
import { rupeesToPaise } from "@/lib/api/money";
import { ApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/session";
import type { Paginated, PaymentQuery, PaymentView } from "@/lib/types";
import type { ScopedListOptions } from "./helpers";

function paymentListPath(churchId: string, options?: ScopedListOptions): string {
  if (options?.forPlatform) return `/admin/churches/${churchId}/payments`;
  return "/payments";
}

export async function getPayments(
  churchId: string,
  query: PaymentQuery = {},
  options?: ScopedListOptions,
): Promise<Paginated<PaymentView>> {
  const result = await apiGetPaginated<Record<string, unknown>>(paymentListPath(churchId, options), {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      method: query.method,
      status: query.status,
      from: query.from,
      to: query.to,
      minAmountPaise: rupeesToPaise(query.minAmount),
      maxAmountPaise: rupeesToPaise(query.maxAmount),
      countsOnly: query.countsOnly ? true : undefined,
    },
  });
  return { ...result, data: result.data.map((row) => mapPaymentView(row)) };
}

export async function getPaymentById(
  _churchId: string,
  paymentId: string,
): Promise<PaymentView | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/payments/${paymentId}`);
    const view = mapPaymentView(row);
    if (row.hasProof) {
      try {
        const proof = await apiGet<{ url?: string; signedUrl?: string }>(
          `/payments/${paymentId}/proof-url`,
        );
        const url = proof.url || proof.signedUrl;
        if (url && view.proof) view.proof.previewUrl = url;
      } catch {
        // Proof remains listed without a preview if the signed URL fails.
      }
    }
    return view;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function getCustomerPayments(
  churchId: string,
  customerId: string,
): Promise<PaymentView[]> {
  const result = await apiGetPaginated<Record<string, unknown>>(
    `/customers/${customerId}/payments`,
    { query: { page: 1, limit: 100 } },
  );
  return result.data.map((row) => mapPaymentView(row, churchId ? ({ id: churchId } as never) : null));
}

export async function confirmRecordedOfferings(churchId: string): Promise<void> {
  const session = await getSession();
  if (session?.currentRole !== "CHURCH_ADMIN") return;

  const pending = await getPayments(churchId, { status: "PENDING_VERIFICATION", limit: 100 });
  for (const payment of pending.data) {
    if (payment.method !== "CASH" && !payment.proof) continue;
    try {
      await verifyPayment(churchId, payment.id, session.currentUser.id);
    } catch (error) {
      if (error instanceof ApiError && (error.isForbidden || error.isNotFound)) continue;
      throw error;
    }
  }
}

export async function getPendingVerificationCount(_churchId: string): Promise<number> {
  const result = await apiGetPaginated<Record<string, unknown>>("/payments", {
    query: { status: "PENDING_VERIFICATION", page: 1, limit: 1, countsOnly: true },
  });
  return result.total;
}

export async function verifyPayment(
  _churchId: string,
  paymentId: string,
  _actorUserId: string,
): Promise<PaymentView | null> {
  try {
    const { data } = await apiPost<Record<string, unknown>>(`/payments/${paymentId}/verify`, {});
    try {
      await apiPost("/receipts", { paymentId });
    } catch (error) {
      if (!(error instanceof ApiError && (error.isConflict || error.code === "PAYMENT_NOT_VERIFIED"))) {
        // Receipt issue is idempotent; ignore already-issued. Re-throw others.
        if (!(error instanceof ApiError && error.code === "CONFLICT")) throw error;
      }
    }
    return mapPaymentView(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

/** @deprecated use verifyPayment */
export const verifyMockPayment = verifyPayment;

export async function rejectPayment(
  _churchId: string,
  paymentId: string,
  _actorUserId: string,
  reason: string,
): Promise<PaymentView | null> {
  try {
    const { data } = await apiPost<Record<string, unknown>>(`/payments/${paymentId}/reject`, {
      reason,
    });
    return mapPaymentView(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

/** @deprecated use rejectPayment */
export const rejectMockPayment = rejectPayment;
