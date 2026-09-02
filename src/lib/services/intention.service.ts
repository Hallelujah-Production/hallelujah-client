import "server-only";

import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, apiUpload } from "@/lib/api/client";
import { mapIntention } from "@/lib/api/adapters";
import { ApiError, userMessage } from "@/lib/api/errors";
import { rupeesToPaise } from "@/lib/api/money";
import { TODAY, formatPrayerDuration } from "@/lib/utils";
import { toCsv } from "@/lib/csv";
import type {
  IntentionQuery,
  IntentionStatus,
  IntentionView,
  Paginated,
  PaymentMethod,
  PaymentProof,
} from "@/lib/types";
import { requiresTransactionId } from "@/lib/types";
import type { ScopedListOptions } from "./helpers";

function intentionListPath(churchId: string, options?: ScopedListOptions): string {
  if (options?.forPlatform) return `/admin/churches/${churchId}/intentions`;
  return "/intentions";
}

export async function getIntentions(
  churchId: string,
  query: IntentionQuery = {},
  options?: ScopedListOptions,
): Promise<Paginated<IntentionView>> {
  const result = await apiGetPaginated<Record<string, unknown>>(intentionListPath(churchId, options), {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      status: query.status,
      prayerTypeId: query.prayerTypeId && query.prayerTypeId !== "ALL" ? query.prayerTypeId : undefined,
      staffId: query.staffId && query.staffId !== "ALL" ? query.staffId : undefined,
      paymentStatus: query.paymentStatus,
      from: query.from,
      to: query.to,
      progress: query.progress && query.progress !== "ALL" ? query.progress : undefined,
      countsOnly: query.countsOnly ? true : undefined,
    },
  });
  return { ...result, data: result.data.map((row) => mapIntention(row)) };
}

export async function getIntentionRegister(
  query: IntentionQuery = {},
): Promise<Paginated<IntentionView>> {
  const result = await apiGetPaginated<Record<string, unknown>>("/intentions/register", {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      parishId: query.parishId,
      progress: query.progress && query.progress !== "ALL" ? query.progress : undefined,
      status: query.status,
      prayerTypeId: query.prayerTypeId && query.prayerTypeId !== "ALL" ? query.prayerTypeId : undefined,
      staffId: query.staffId && query.staffId !== "ALL" ? query.staffId : undefined,
      paymentStatus: query.paymentStatus && query.paymentStatus !== "ALL" ? query.paymentStatus : undefined,
      from: query.from,
      to: query.to,
      countsOnly: query.countsOnly ? true : undefined,
    },
  });
  return { ...result, data: result.data.map((row) => mapIntention(row)) };
}

const REGISTER_EXPORT_PAGE = 100;
const REGISTER_EXPORT_CAP = 2000;

export async function buildIntentionRegisterCsv(
  query: Omit<IntentionQuery, "page" | "limit">,
): Promise<{ csv: string; total: number; truncated: boolean }> {
  const rows: IntentionView[] = [];
  let page = 1;
  let total = 0;
  let totalPages = 1;

  while (rows.length < REGISTER_EXPORT_CAP) {
    const result = await getIntentionRegister({
      ...query,
      page,
      limit: REGISTER_EXPORT_PAGE,
    });
    total = result.total;
    totalPages = result.totalPages;
    rows.push(...result.data);
    if (page >= totalPages || result.data.length === 0) break;
    page += 1;
  }

  const truncated = total > rows.length;
  const csv = intentionRegisterToCsv(rows);
  return { csv, total, truncated };
}

function asDateCell(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function progressLabel(status: IntentionView["status"]): string {
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return "Pending";
}

function paymentLabel(status: IntentionView["payment"]["status"]): string {
  if (status === "VERIFIED") return "Verified";
  if (status === "REJECTED") return "Rejected";
  return "Awaiting verification";
}

function intentionRegisterToCsv(rows: IntentionView[]): string {
  return toCsv(
    [
      "Reference",
      "Church",
      "Created at",
      "Created by",
      "Family name",
      "Mobile",
      "Prayer for",
      "Prayer type",
      "Prayer date",
      "Amount (INR)",
      "Progress",
      "Status",
      "Completed at",
      "Time offered",
      "Assigned staff",
      "Payment",
      "Method",
    ],
    rows.map((row) => [
      row.reference,
      row.church.name,
      asDateCell(row.createdAt),
      row.createdByName ?? (row.source === "PUBLIC" ? "Public page" : ""),
      row.customer.name,
      row.customer.mobile ?? "",
      row.prayerFor,
      row.prayerType.name,
      asDateCell(row.prayerDate),
      row.amount,
      progressLabel(row.status),
      row.status,
      asDateCell(row.completedAt),
      row.status === "COMPLETED" || row.startedAt
        ? formatPrayerDuration(row.startedAt, row.completedAt)
        : "",
      row.assignedStaff?.name ?? "",
      paymentLabel(row.payment.status),
      row.payment.method,
    ]),
  );
}

export async function getIntentionById(
  _churchId: string,
  id: string,
): Promise<IntentionView | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/intentions/${id}`);
    const view = mapIntention(row);
    const extras: Promise<void>[] = [];
    if (view.payment?.id && view.payment.proof) {
      extras.push(
        apiGet<{ url?: string; signedUrl?: string }>(`/payments/${view.payment.id}/proof-url`)
          .then((proof) => {
            const url = proof.url || proof.signedUrl;
            if (url) view.payment.proof!.previewUrl = url;
          })
          .catch(() => undefined),
      );
    }
    if (!view.receiptId && view.reference) {
      extras.push(
        apiGetPaginated<Record<string, unknown>>("/receipts", {
          query: { search: view.reference, limit: 5 },
        })
          .then((receipts) => {
            const match = receipts.data.find(
              (r) => r.intentionReference === view.reference || r.intentionId === view.id,
            );
            if (match) view.receiptId = String(match.id);
          })
          .catch(() => undefined),
      );
    }
    if (extras.length) await Promise.all(extras);
    return view;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function getIntentionByReference(_reference: string): Promise<IntentionView | null> {
  return null;
}

export async function getPrayerSchedule(
  _churchId: string,
  date = TODAY,
): Promise<IntentionView[]> {
  const result = await getIntentions(_churchId, { from: date, to: date, limit: 100, page: 1 });
  return result.data.filter((i) => i.status !== "CANCELLED");
}

export async function getCustomerIntentions(
  _churchId: string,
  customerId: string,
): Promise<IntentionView[]> {
  const result = await apiGetPaginated<Record<string, unknown>>(
    `/customers/${customerId}/intentions`,
    { query: { page: 1, limit: 100 } },
  );
  return result.data.map((row) => mapIntention(row));
}

export type StaffScope = "today" | "upcoming" | "completed" | "all" | "queue";

export async function getStaffIntentions(
  _churchId: string,
  _staffUserId: string,
  scope: StaffScope = "all",
  query: { page?: number; limit?: number; search?: string } = {},
): Promise<Paginated<IntentionView>> {
  const result = await apiGetPaginated<Record<string, unknown>>("/my-prayers", {
    query: {
      scope,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
    },
  });
  return { ...result, data: result.data.map((row) => mapIntention(row)) };
}

export async function getStaffIntentionById(
  _churchId: string,
  _staffUserId: string,
  id: string,
): Promise<IntentionView | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/my-prayers/${id}`);
    return mapIntention(row);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export interface CreateIntentionInput {
  churchId: string;
  prayerTypeId: string;
  /** Every type chosen, primary first. Falls back to `prayerTypeId` when absent. */
  prayerTypeIds?: string[];
  prayerFor: string;
  requestedBy: string;
  prayerDate: string;
  preferredTime?: string;
  message?: string;
  customer: {
    id?: string;
    name: string;
    mobile?: string;
    email?: string;
    addressLine?: string;
    city?: string;
  };
  payment?: {
    amount: number;
    method: PaymentMethod;
    provider?: string;
    transactionId?: string;
    notes?: string;
    proof?: Omit<PaymentProof, "id" | "uploadedAt">;
  };
  proofFile?: File | null;
  slug?: string;
  source: "PUBLIC" | "STAFF";
  actorUserId?: string;
  assignedStaffUserId?: string;
}

export type FieldErrors = Record<string, string>;

export type CreateIntentionResult =
  | { ok: true; intention: IntentionView }
  | { ok: false; errors: FieldErrors };

function clientValidation(input: CreateIntentionInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.prayerFor?.trim()) {
    errors.prayerFor = "Enter the name of the person the prayer is offered for.";
  }
  if (!input.customer.name?.trim()) {
    errors.customerName = "Enter your full name so the church can identify the intention.";
  }
  if (input.source === "PUBLIC") {
    if (!/^[0-9]{10}$/.test((input.customer.mobile ?? "").replace(/\s|-/g, ""))) {
      errors.customerMobile = "Enter a valid 10-digit mobile number.";
    }
  }
  if (input.customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customer.email)) {
    errors.customerEmail = "Enter a valid email address, or leave it blank.";
  }
  if (!input.prayerDate) {
    errors.prayerDate = "Choose the date on which the prayer should be offered.";
  }
  if (input.source === "STAFF") {
    if (!input.payment) {
      errors.form = "Record how the offering was received (Cash or UPI / PhonePe).";
    } else {
      if (!Number.isInteger(input.payment.amount) || input.payment.amount < 1) {
        errors.amount = "Enter the amount the customer paid, in whole rupees.";
      }
      if (requiresTransactionId(input.payment.method) && !input.payment.transactionId?.trim()) {
        errors.transactionId = "Transaction ID is required for UPI payments.";
      }
    }
  }
  return errors;
}

function mapApiFields(fields?: Record<string, string>): FieldErrors {
  if (!fields) return {};
  const mapped: FieldErrors = { ...fields };
  if (fields.customer) mapped.customerName = fields.customer;
  if (fields["customer.name"]) mapped.customerName = fields["customer.name"];
  if (fields["customer.mobile"]) mapped.customerMobile = fields["customer.mobile"];
  if (fields["customer.email"]) mapped.customerEmail = fields["customer.email"];
  if (fields.transactionReference) mapped.transactionId = fields.transactionReference;
  if (fields.amountPaise) mapped.amount = fields.amountPaise;
  if (fields["payment.amountPaise"]) mapped.amount = fields["payment.amountPaise"];
  if (fields.payment) mapped.form = fields.payment;
  return mapped;
}

export async function createIntention(input: CreateIntentionInput): Promise<CreateIntentionResult> {
  const errors = clientValidation(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const mobile = (input.customer.mobile ?? "").replace(/\s|-/g, "");
  const customer = {
    name: input.customer.name.trim(),
    ...(mobile ? { mobile } : {}),
    email: input.customer.email?.trim() || undefined,
    addressLine: input.customer.addressLine?.trim() || undefined,
    city: input.customer.city,
  };

  const payload: Record<string, unknown> = {
    customerId: input.customer.id,
    customer: input.customer.id ? undefined : customer,
    prayerTypeId: input.prayerTypeId,
    // The counter sends every type the family is offering for. The public page
    // still sends one, and the API accepts either.
    prayerTypeIds: input.prayerTypeIds?.length ? input.prayerTypeIds : undefined,
    prayerFor: input.prayerFor.trim(),
    requestedBy: input.requestedBy?.trim() || customer.name,
    prayerDate: input.prayerDate,
    preferredTime: input.preferredTime || undefined,
    message: input.message?.trim() || undefined,
  };

  try {
    if (input.source === "PUBLIC") {
      const { data } = await apiPost<Record<string, unknown>>("/public/intentions", {
        ...payload,
        slug: input.slug,
      });
      return { ok: true, intention: mapIntention(data) };
    }

    if (input.payment) {
      payload.payment = {
        method: input.payment.method,
        amountPaise: rupeesToPaise(input.payment.amount),
        transactionReference:
          input.payment.method === "UPI" ? input.payment.transactionId?.trim() : undefined,
        provider: input.payment.provider || undefined,
        notes: input.payment.notes || undefined,
      };
    }
    if (input.assignedStaffUserId) {
      payload.assignedStaffUserId = input.assignedStaffUserId;
    }

    const { data } = await apiPost<Record<string, unknown>>("/intentions", payload);
    let intention = mapIntention(data);

    if (input.proofFile && intention.paymentId) {
      const form = new FormData();
      form.append("file", input.proofFile);
      await apiUpload(`/payments/${intention.paymentId}/proof`, form);
      const refreshed = await getIntentionById(input.churchId, intention.id);
      if (refreshed) intention = refreshed;
    }

    if (!intention.receiptId && intention.reference) {
      try {
        const receipts = await apiGetPaginated<Record<string, unknown>>("/receipts", {
          query: { search: intention.reference, limit: 5 },
        });
        const match = receipts.data.find(
          (row) => row.intentionReference === intention.reference || row.intentionId === intention.id,
        );
        if (match) intention.receiptId = String(match.id);
      } catch {
        // Receipt is already issued on create; the id is optional for Print.
      }
    }

    return { ok: true, intention };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        errors: {
          form: userMessage(error),
          ...mapApiFields(error.fields),
        },
      };
    }
    throw error;
  }
}

/** @deprecated use createIntention */
export const createMockIntention = createIntention;

export async function assignIntention(
  _churchId: string,
  intentionId: string,
  staffUserId: string,
  _actorUserId: string,
): Promise<IntentionView | null> {
  try {
    const { data } = await apiPost<Record<string, unknown>>(`/intentions/${intentionId}/assign`, {
      staffUserId,
    });
    return mapIntention(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

/** @deprecated use assignIntention */
export const assignMockIntention = assignIntention;

export async function startIntention(
  _churchId: string,
  intentionId: string,
): Promise<IntentionView | null> {
  try {
    const { data } = await apiPost<Record<string, unknown>>(`/intentions/${intentionId}/start`, {});
    return mapIntention(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function completeIntention(
  _churchId: string,
  intentionId: string,
  _actorUserId: string,
): Promise<IntentionView | null> {
  try {
    const { data } = await apiPost<Record<string, unknown>>(
      `/intentions/${intentionId}/complete`,
      {},
    );
    return mapIntention(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

/** @deprecated use completeIntention */
export const completeMockIntention = completeIntention;

export async function cancelIntention(
  _churchId: string,
  intentionId: string,
  reason?: string,
): Promise<IntentionView | null> {
  try {
    const { data } = await apiPost<Record<string, unknown>>(`/intentions/${intentionId}/cancel`, {
      reason: reason || "Cancelled by the church.",
    });
    return mapIntention(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function setIntentionStatus(
  churchId: string,
  intentionId: string,
  status: IntentionStatus,
  _actorUserId: string,
  reason?: string,
): Promise<IntentionView | null> {
  if (status === "CANCELLED") return cancelIntention(churchId, intentionId, reason);
  throw new ApiError(409, "INVALID_STATE_TRANSITION", "That change is not allowed from the current status.");
}

export async function updateIntention(
  _churchId: string,
  intentionId: string,
  patch: Partial<{
    prayerFor: string;
    prayerDate: string;
    preferredTime: string | null;
    message: string | null;
    prayerTypeId: string;
    requestedBy: string;
  }>,
): Promise<IntentionView | null> {
  try {
    const { data } = await apiPatch<Record<string, unknown>>(`/intentions/${intentionId}`, patch);
    return mapIntention(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

/** @deprecated use updateIntention */
export const updateMockIntention = updateIntention;

export async function deleteIntention(_churchId: string, intentionId: string): Promise<boolean> {
  try {
    await apiDelete(`/intentions/${intentionId}`);
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      try {
        await apiPost(`/intentions/${intentionId}/delete`, {});
        return true;
      } catch (fallback) {
        if (fallback instanceof ApiError && fallback.isNotFound) return false;
        throw fallback;
      }
    }
    throw error;
  }
}
