import "server-only";

import { apiGet, apiGetPaginated, apiPost } from "@/lib/api/client";
import { mapOfficialReceipt, mapReceiptListItem } from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { ListQuery, Paginated, ReceiptView } from "@/lib/types";

export async function getReceipts(
  _churchId: string,
  query: ListQuery = {},
): Promise<Paginated<ReceiptView>> {
  const result = await apiGetPaginated<Record<string, unknown>>("/receipts", {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      from: query.from,
      to: query.to,
    },
  });
  return { ...result, data: result.data.map((row) => mapReceiptListItem(row)) };
}

export async function getReceipt(churchId: string, receiptId: string): Promise<ReceiptView | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/receipts/${receiptId}`);
    return mapOfficialReceipt(row);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function getCustomerReceipts(
  churchId: string,
  customerId: string,
): Promise<ReceiptView[]> {
  const result = await apiGetPaginated<Record<string, unknown>>(
    `/customers/${customerId}/receipts`,
    { query: { page: 1, limit: 100 } },
  );
  return result.data.map((row) => mapReceiptListItem(row, churchId ? ({ id: churchId } as never) : null));
}

export async function getReceiptByReference(
  reference: string,
  mobile: string,
): Promise<ReceiptView | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(
      `/public/receipts/${encodeURIComponent(reference)}`,
      { query: { mobile } },
    );
    return mapOfficialReceipt(row);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) return null;
    throw error;
  }
}

export async function getReceiptByIntention(
  churchId: string,
  intentionId: string,
): Promise<ReceiptView | null> {
  const result = await getReceipts(churchId, { limit: 20, page: 1 });
  const match = result.data.find((r) => r.intentionId === intentionId);
  if (!match) return null;
  return getReceipt(churchId, match.id);
}

export async function issueReceipt(paymentId: string): Promise<ReceiptView | null> {
  try {
    const { data } = await apiPost<Record<string, unknown>>("/receipts", { paymentId });
    return mapOfficialReceipt(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}
