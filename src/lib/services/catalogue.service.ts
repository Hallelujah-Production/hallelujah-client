import "server-only";

import { apiGet, apiGetPaginated, apiPatch, apiPost, emptyPage } from "@/lib/api/client";
import { mapPrayerType } from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import { rupeesToPaise } from "@/lib/api/money";
import type { AuditLog, Paginated, PrayerType } from "@/lib/types";

export async function getPrayerTypes(includeInactive = false): Promise<PrayerType[]> {
  if (includeInactive) {
    const result = await apiGetPaginated<Record<string, unknown>>("/admin/prayer-types", {
      query: { limit: 100 },
    });
    return result.data.map(mapPrayerType);
  }
  try {
    const rows = await apiGet<Record<string, unknown>[]>("/public/prayer-types", { revalidate: 60 });
    return (rows ?? []).map(mapPrayerType);
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
}

export async function getChurchPrayerTypes(slug: string): Promise<PrayerType[]> {
  try {
    const rows = await apiGet<Record<string, unknown>[]>(
      `/public/churches/${slug}/prayer-types`,
      { revalidate: 60 },
    );
    return (rows ?? []).map(mapPrayerType);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return [];
    throw error;
  }
}

export async function getOfferedPrayerTypes(): Promise<PrayerType[]> {
  const rows = await apiGet<Record<string, unknown>[]>("/settings/prayer-types");
  return (rows ?? []).map(mapPrayerType);
}

export async function getPrayerTypeById(id: string): Promise<PrayerType | null> {
  const types = await getPrayerTypes(true);
  return types.find((t) => t.id === id) ?? null;
}

export async function createPrayerType(input: {
  code: string;
  name: string;
  description: string;
  suggestedAmount: number;
  durationMinutes: number;
}): Promise<PrayerType> {
  const { data } = await apiPost<Record<string, unknown>>("/admin/prayer-types", {
    code: input.code,
    name: input.name,
    description: input.description,
    defaultAmountPaise: rupeesToPaise(input.suggestedAmount),
    durationMinutes: input.durationMinutes,
  });
  return mapPrayerType(data);
}

/** @deprecated use createPrayerType */
export const createMockPrayerType = createPrayerType;

export async function setPrayerTypeActive(id: string, isActive: boolean): Promise<void> {
  await apiPatch(`/admin/prayer-types/${id}`, { isActive });
}

export async function updatePrayerType(
  id: string,
  patch: Partial<Pick<PrayerType, "name" | "description" | "suggestedAmount" | "durationMinutes">>,
): Promise<PrayerType | null> {
  const { data } = await apiPatch<Record<string, unknown>>(`/admin/prayer-types/${id}`, {
    name: patch.name,
    description: patch.description,
    durationMinutes: patch.durationMinutes,
    defaultAmountPaise:
      patch.suggestedAmount !== undefined ? rupeesToPaise(patch.suggestedAmount) : undefined,
  });
  return mapPrayerType(data);
}

/** @deprecated use updatePrayerType */
export const updateMockPrayerType = updatePrayerType;

export async function updateChurchPrayerPricing(
  prayerTypeId: string,
  patch: { amountPaise?: number; isOffered?: boolean },
): Promise<void> {
  await apiPatch(`/settings/prayer-types/${prayerTypeId}`, patch);
}

export async function getPrayerTypeUsage(): Promise<Record<string, number>> {
  try {
    const report = await apiGetPaginated<{ prayerTypeId: string; intentionCount: number }>(
      "/reports/prayer-types",
      { query: { period: "this_month", limit: 100 } },
    );
    const counts: Record<string, number> = {};
    for (const row of report.data) {
      counts[row.prayerTypeId] = row.intentionCount;
    }
    return counts;
  } catch {
    try {
      const report = await apiGetPaginated<{ prayerTypeId: string; intentionCount: number }>(
        "/admin/reports/prayer-types",
        { query: { period: "this_month", limit: 100 } },
      );
      const counts: Record<string, number> = {};
      for (const row of report.data) {
        counts[row.prayerTypeId] = row.intentionCount;
      }
      return counts;
    } catch {
      return {};
    }
  }
}

export async function getAuditLogs(
  params: {
    churchId?: string | "ALL";
    action?: string | "ALL";
    search?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<Paginated<AuditLog>> {
  return emptyPage<AuditLog>(params.page ?? 1, params.limit ?? 20);
}

export async function getAuditActions(): Promise<string[]> {
  return [];
}

export async function getRecentActivity(_limit = 10): Promise<AuditLog[]> {
  return [];
}
