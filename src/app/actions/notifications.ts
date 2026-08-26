"use server";

import { revalidatePath } from "next/cache";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/services";
import { getSession } from "@/lib/session";

export async function markReadAction(id: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  await markNotificationRead(id);
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markAllReadAction(): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  await markAllNotificationsRead();
  revalidatePath("/notifications");
  return { ok: true };
}
