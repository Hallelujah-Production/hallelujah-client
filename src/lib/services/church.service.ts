import "server-only";

import { cache } from "react";
import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api/client";
import { mapChurch, mapChurchView, mapPublicChurch } from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { Church, ChurchView, Paginated } from "@/lib/types";

export async function getChurches(params: { search?: string } = {}): Promise<Church[]> {
  try {
    const rows = await apiGet<Record<string, unknown>[]>("/public/churches", {
      query: { search: params.search },
      revalidate: 60,
    });
    return (rows ?? []).map((row) => mapPublicChurch(row));
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
}

export async function getFeaturedChurches(limit = 3): Promise<Church[]> {
  try {
    const rows = await apiGet<Record<string, unknown>[]>("/public/churches/featured", {
      query: { limit },
      revalidate: 60,
    });
    return (rows ?? []).map((row) => mapPublicChurch(row));
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
}

export async function getChurchBySlug(slug: string): Promise<Church | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/public/churches/${slug}`, {
      revalidate: 60,
    });
    return mapPublicChurch(row);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

/** Signed-in tenant profile, including service times Church Admin can edit. */
export async function getOwnChurch(): Promise<Church | null> {
  try {
    const row = await apiGet<Record<string, unknown>>("/settings/church");
    return mapChurch(row);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) return null;
    throw error;
  }
}

export const getChurchBySlugForPlatform = cache(async (slug: string): Promise<Church | null> => {
  try {
    const row = await apiGet<Record<string, unknown>>(`/admin/churches/${slug}`);
    return mapChurchView(row);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
});

export async function getChurchById(id: string): Promise<Church | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/admin/churches/${id}`);
    return mapChurchView(row);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function getAllChurchSlugs(): Promise<string[]> {
  try {
    const churches = await getChurches();
    return churches.map((c) => c.slug);
  } catch {
    return [];
  }
}

export async function getChurchViews(
  params: { search?: string; status?: "ALL" | "ACTIVE" | "INACTIVE"; page?: number; limit?: number } = {},
): Promise<Paginated<ChurchView>> {
  const result = await apiGetPaginated<Record<string, unknown>>("/admin/churches", {
    query: {
      search: params.search,
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return { ...result, data: result.data.map(mapChurchView) };
}

export async function getChurchView(churchId: string): Promise<ChurchView | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/admin/churches/${churchId}`);
    return mapChurchView(row);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export interface CreateChurchInput {
  name: string;
  city: string;
  state: string;
  addressLine1: string;
  postalCode: string;
  phone: string;
  email: string;
  tagline?: string;
  description?: string;
  adminName?: string;
  adminUsername?: string;
  adminPhone?: string;
  adminUserId?: string;
  adminPassword?: string;
  adminConfirmPassword?: string;
}

export async function createChurch(
  input: CreateChurchInput,
): Promise<{ church: Church; invitationSent?: boolean }> {
  const { data } = await apiPost<{
    church: Record<string, unknown>;
    admin: Record<string, unknown>;
    invitationSent?: boolean;
  }>("/admin/churches", input);
  return {
    church: mapChurchView(data.church),
    invitationSent: data.invitationSent,
  };
}

/** @deprecated use createChurch */
export const createMockChurch = async (input: CreateChurchInput): Promise<Church> => {
  const { church } = await createChurch(input);
  return church;
};

export async function setChurchActive(churchId: string, isActive: boolean): Promise<void> {
  await apiPost(`/admin/churches/${churchId}/status`, { isActive });
}

export async function deleteChurch(churchId: string): Promise<void> {
  await apiDelete(`/admin/churches/${churchId}`);
}

export async function getChurchAdmins(churchId: string): Promise<
  {
    id: string;
    name: string;
    username: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    avatarInitials: string;
    invitationPending: boolean;
  }[]
> {
  const rows = await apiGet<
    {
      id: string;
      name: string;
      username: string;
      email: string | null;
      phone: string | null;
      isActive: boolean;
      avatarInitials: string;
      invitationPending: boolean;
    }[]
  >(`/admin/churches/${churchId}/admins`);
  return rows ?? [];
}

export async function assignChurchAdmin(churchId: string, userId: string): Promise<void> {
  await apiPost(`/admin/churches/${churchId}/admins`, { userId });
}

export async function unassignChurchAdmin(churchId: string, userId: string): Promise<void> {
  await apiDelete(`/admin/churches/${churchId}/admins/${userId}`);
}

export async function updateChurch(
  churchId: string,
  patch: Partial<Omit<Church, "id" | "slug">>,
): Promise<Church | null> {
  try {
    const { data } = await apiPatch<Record<string, unknown>>("/settings/church", patch);
    return mapChurch(data);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

/** @deprecated use updateChurch */
export const updateMockChurch = updateChurch;
