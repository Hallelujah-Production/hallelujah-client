import type { Metadata } from "next";
import { Suspense } from "react";
import { assertChurchSession } from "@/lib/guards";
import { getSession } from "@/lib/session";
import {
  getDashboardStats,
  getIntentions,
  getPrayerSchedule,
  getStaffIntentions,
  getStaffStats,
} from "@/lib/services";
import { ignoreForbidden } from "@/lib/services/helpers";
import { AdminDashboard } from "./admin-dashboard";
import { StaffDashboard } from "./staff-dashboard";
import DashboardLoading from "./loading";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

/**
 * One route, two experiences. Both roles land on /dashboard; what they see is
 * decided by the role on the session, never by the URL.
 *
 * Church Admin data starts in parallel with /auth/me. Staff data starts after
 * role is known so we do not contend the connection pool with 403s.
 */
export default async function DashboardPage() {
  const sessionPromise = getSession();
  const adminStatsP = ignoreForbidden(getDashboardStats(""));
  const scheduleP = ignoreForbidden(getPrayerSchedule(""));
  const awaitingP = ignoreForbidden(
    getIntentions("", { paymentStatus: "PENDING_VERIFICATION", limit: 5 }),
  );

  const session = assertChurchSession(await sessionPromise);

  if (session.currentRole === "CHURCH_ADMIN") {
    const [stats, schedule, awaiting] = await Promise.all([adminStatsP, scheduleP, awaitingP]);
    return (
      <Suspense fallback={<DashboardLoading />}>
        <AdminDashboard
          session={session}
          stats={stats ?? undefined}
          schedule={schedule ?? undefined}
          awaiting={awaiting ?? undefined}
        />
      </Suspense>
    );
  }

  const [stats, today, upcoming] = await Promise.all([
    getStaffStats(session.currentChurch.id, session.currentUser.id),
    getStaffIntentions(session.currentChurch.id, session.currentUser.id, "today", { limit: 20 }),
    getStaffIntentions(session.currentChurch.id, session.currentUser.id, "upcoming", { limit: 6 }),
  ]);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <StaffDashboard session={session} stats={stats} today={today} upcoming={upcoming} />
    </Suspense>
  );
}
