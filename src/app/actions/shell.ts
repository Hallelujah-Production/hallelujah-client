"use server";

import { getPendingVerificationCount, getUnreadCount } from "@/lib/services";
import { getSession } from "@/lib/session";

export async function loadShellBadges(): Promise<{
  notifications: number;
  paymentsPending: number;
}> {
  const unreadPromise = getUnreadCount();
  const session = await getSession();
  if (!session) return { notifications: 0, paymentsPending: 0 };

  const [notifications, paymentsPending] = await Promise.all([
    unreadPromise,
    session.currentRole === "CHURCH_ADMIN" && session.currentChurch
      ? getPendingVerificationCount(session.currentChurch.id)
      : Promise.resolve(0),
  ]);

  return { notifications, paymentsPending };
}
