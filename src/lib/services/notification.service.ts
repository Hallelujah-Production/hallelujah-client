import "server-only";

import { apiGet, apiGetPaginated, apiPost } from "@/lib/api/client";
import { mapNotification } from "@/lib/api/adapters";
import type { AppNotification, Paginated, Role } from "@/lib/types";

interface Scope {
  role: Role;
  userId: string;
  churchId: string | null;
}

export async function getNotifications(
  _scope: Scope,
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<AppNotification>> {
  const result = await apiGetPaginated<Record<string, unknown>>("/notifications", {
    query: { page: query.page ?? 1, limit: query.limit ?? 20 },
  });
  return { ...result, data: result.data.map(mapNotification) };
}

export async function getUnreadCount(_scope?: Scope): Promise<number> {
  const data = await apiGet<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id: string, _scope?: Scope): Promise<void> {
  await apiPost(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead(_scope?: Scope): Promise<void> {
  await apiPost("/notifications/read-all", {});
}

export function groupNotifications(
  notifications: AppNotification[],
  today: string,
  yesterday: string,
): { label: string; items: AppNotification[] }[] {
  const groups: Record<string, AppNotification[]> = { Today: [], Yesterday: [], Earlier: [] };
  for (const n of notifications) {
    const day = n.createdAt.slice(0, 10);
    if (day === today) groups.Today.push(n);
    else if (day === yesterday) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}
