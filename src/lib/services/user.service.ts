import "server-only";

import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api/client";
import { mapUser, mapUserView } from "@/lib/api/adapters";
import { ApiError, userMessage } from "@/lib/api/errors";
import { getSession } from "@/lib/session";
import type { Paginated, Role, User, UserView } from "@/lib/types";
import { developmentInviteToken } from "./helpers";

export async function getUserById(id: string): Promise<User | null> {
  try {
    const row = await apiGet<Record<string, unknown>>(`/team/${id}`);
    return mapUser(row);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      try {
        const row = await apiGet<Record<string, unknown>>(`/admin/users/${id}`);
        return mapUser(row);
      } catch (inner) {
        if (inner instanceof ApiError && inner.isNotFound) return null;
        throw inner;
      }
    }
    throw error;
  }
}

export async function getChurchTeam(
  churchId: string,
  params: { search?: string; role?: Role | "ALL"; page?: number; limit?: number } = {},
): Promise<Paginated<UserView>> {
  const session = await getSession();
  if (session?.currentRole === "SUPER_ADMIN") {
    return getUsers({
      search: params.search,
      role: params.role,
      churchId,
      page: params.page,
      limit: params.limit,
    });
  }
  const result = await apiGetPaginated<Record<string, unknown>>("/team", {
    query: {
      search: params.search,
      role: params.role,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return { ...result, data: result.data.map(mapUserView) };
}

export async function getAssignableStaff(churchId?: string): Promise<User[]> {
  try {
    const rows = await apiGet<Record<string, unknown>[]>("/team/prayer-staff");
    if (Array.isArray(rows) && rows.length) {
      return rows
        .map(mapUser)
        .filter(
          (u) =>
            u.role === "CHURCH_STAFF" &&
            u.isActive &&
            (!churchId || u.churchId === churchId),
        );
    }
  } catch {
    // Fall through to the current-workspace team list.
  }
  const result = await apiGetPaginated<Record<string, unknown>>("/team", {
    query: { role: "CHURCH_STAFF", status: "ACTIVE", limit: 100 },
  });
  return result.data
    .map(mapUser)
    .filter(
      (u) =>
        u.role === "CHURCH_STAFF" &&
        u.isActive &&
        (!churchId || u.churchId === churchId),
    );
}

export async function getUsers(
  params: {
    search?: string;
    role?: Role | "ALL";
    churchId?: string | "ALL";
    status?: "ALL" | "ACTIVE" | "INACTIVE";
    page?: number;
    limit?: number;
  } = {},
): Promise<Paginated<UserView>> {
  const result = await apiGetPaginated<Record<string, unknown>>("/admin/users", {
    query: {
      search: params.search,
      role: params.role,
      churchId: params.churchId && params.churchId !== "ALL" ? params.churchId : undefined,
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return { ...result, data: result.data.map(mapUserView) };
}

export async function getUserCounts() {
  const [all, admins, staff, supers] = await Promise.all([
    apiGetPaginated<Record<string, unknown>>("/admin/users", {
      query: { limit: 1, countsOnly: true },
    }),
    apiGetPaginated<Record<string, unknown>>("/admin/users", {
      query: { role: "CHURCH_ADMIN", limit: 1, countsOnly: true },
    }),
    apiGetPaginated<Record<string, unknown>>("/admin/users", {
      query: { role: "CHURCH_STAFF", limit: 1, countsOnly: true },
    }),
    apiGetPaginated<Record<string, unknown>>("/admin/users", {
      query: { role: "SUPER_ADMIN", limit: 1, countsOnly: true },
    }),
  ]);
  return {
    total: all.total,
    admins: admins.total,
    staff: staff.total,
    superAdmins: supers.total,
  };
}

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  role: Exclude<Role, "SUPER_ADMIN"> | Role;
  churchId: string | null;
}

export async function createUser(
  input: CreateUserInput,
  actor: { role: Role; churchId: string | null },
): Promise<
  { ok: true; user: User; invitationSent?: boolean; devInviteToken?: string } | { ok: false; error: string }
> {
  try {
    if (actor.role === "SUPER_ADMIN") {
      const { data } = await apiPost<{
        user: Record<string, unknown>;
        invitationSent?: boolean;
        devInviteToken?: string;
      }>("/admin/users", {
        name: input.name,
        email: input.email,
        phone: input.phone || undefined,
        role: input.role,
        churchId: input.role === "SUPER_ADMIN" ? undefined : input.churchId,
      });
      return {
        ok: true,
        user: mapUser(data.user),
        invitationSent: data.invitationSent,
        devInviteToken: developmentInviteToken(data.devInviteToken),
      };
    }
    const { data } = await apiPost<{
      user: Record<string, unknown>;
      invitationSent?: boolean;
      devInviteToken?: string;
    }>("/team", {
      name: input.name,
      email: input.email,
      phone: input.phone || undefined,
      role: input.role === "CHURCH_ADMIN" ? "CHURCH_ADMIN" : "CHURCH_STAFF",
      churchId: input.churchId || undefined,
    });
    return {
      ok: true,
      user: mapUser(data.user),
      invitationSent: data.invitationSent,
      devInviteToken: developmentInviteToken(data.devInviteToken),
    };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: userMessage(error) };
    throw error;
  }
}

/** @deprecated use createUser */
export const createMockUser = createUser;

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  try {
    await apiPost(`/team/${userId}/status`, { isActive });
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) {
      await apiPost(`/admin/users/${userId}/status`, { isActive });
      return;
    }
    throw error;
  }
}

export async function updateUser(
  userId: string,
  patch: Partial<Pick<User, "name" | "email" | "phone" | "role">>,
): Promise<User | null> {
  try {
    const { data } = await apiPatch<Record<string, unknown>>(`/team/${userId}`, patch);
    return mapUser(data);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) {
      const { data } = await apiPatch<Record<string, unknown>>(`/admin/users/${userId}`, patch);
      return mapUser(data);
    }
    throw error;
  }
}

export async function resendUserInvitation(
  userId: string,
): Promise<{ invitationSent: true; devInviteToken?: string }> {
  try {
    const { data } = await apiPost<{ invitationSent: true; devInviteToken?: string }>(
      `/team/${userId}/invitation/resend`,
      {},
    );
    return {
      invitationSent: true,
      devInviteToken: developmentInviteToken(data.devInviteToken),
    };
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) {
      const { data } = await apiPost<{ invitationSent: true; devInviteToken?: string }>(
        `/admin/users/${userId}/invitation/resend`,
        {},
      );
      return {
        invitationSent: true,
        devInviteToken: developmentInviteToken(data.devInviteToken),
      };
    }
    throw error;
  }
}

export async function revokeUserInvitation(userId: string): Promise<void> {
  try {
    await apiPost(`/team/${userId}/invitation/revoke`, {});
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) {
      await apiPost(`/admin/users/${userId}/invitation/revoke`, {});
      return;
    }
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await apiDelete(`/team/${userId}`);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) {
      await apiDelete(`/admin/users/${userId}`);
      return;
    }
    throw error;
  }
}

/** @deprecated use updateUser */
export const updateMockUser = updateUser;
