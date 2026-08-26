import "server-only";

import { apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api/client";
import { mapCustomer, mapCustomerView } from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { Customer, CustomerView, ListQuery, Paginated } from "@/lib/types";

export async function getCustomers(
  _churchId: string,
  query: ListQuery = {},
): Promise<Paginated<CustomerView>> {
  const result = await apiGetPaginated<Record<string, unknown>>("/customers", {
    query: {
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });
  return { ...result, data: result.data.map((row) => mapCustomerView(row, _churchId)) };
}

export async function getCustomerById(
  churchId: string,
  customerId: string,
): Promise<CustomerView | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/customers/${customerId}`);
    return mapCustomerView(row, churchId);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function searchCustomers(_churchId: string, search: string): Promise<Customer[]> {
  if (!search.trim()) return [];
  const result = await apiGetPaginated<Record<string, unknown>>("/customers", {
    query: { search, page: 1, limit: 8 },
  });
  return result.data.map((row) => mapCustomer(row, _churchId));
}

export interface CreateCustomerInput {
  churchId: string;
  name: string;
  mobile: string;
  email?: string;
  addressLine?: string;
  city?: string;
  notes?: string;
}

export async function upsertCustomer(input: CreateCustomerInput): Promise<Customer> {
  const { data } = await apiPost<Record<string, unknown>>("/customers", {
    name: input.name,
    mobile: input.mobile,
    email: input.email,
    addressLine: input.addressLine,
    city: input.city,
    notes: input.notes,
  });
  return mapCustomer(data, input.churchId);
}

/** @deprecated use upsertCustomer */
export const upsertMockCustomer = upsertCustomer;

export async function updateCustomer(
  id: string,
  patch: Partial<CreateCustomerInput>,
): Promise<Customer | null> {
  try {
    const { data } = await apiPatch<Record<string, unknown>>(`/customers/${id}`, patch);
    return mapCustomer(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}
