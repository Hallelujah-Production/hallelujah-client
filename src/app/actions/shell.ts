"use server";

import { getPendingVerificationCount, getUnreadCount } from "@/lib/services";
import { getSession } from "@/lib/session";

export async function loadShellBadges(): Promise<{
  notifications: number;
  paymentsPending: number;
}> {
  const session = await getSession();
  if (!session) return { notifications: 0, paymentsPending: 0 };

  const [notifications, paymentsPending] = await Promise.all([
    getUnreadCount({
      role: session.currentRole,
      userId: session.currentUser.id,
      churchId: session.currentChurch?.id ?? null,
    }),
    session.currentRole === "CHURCH_ADMIN" && session.currentChurch
      ? getPendingVerificationCount(session.currentChurch.id)
      : Promise.resolve(0),
  ]);

  return { notifications, paymentsPending };
}
