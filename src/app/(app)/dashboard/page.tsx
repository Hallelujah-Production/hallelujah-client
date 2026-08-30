import type { Metadata } from "next";
import { Suspense } from "react";
import { assertChurchSession } from "@/lib/guards";
import { getSession, peekRole } from "@/lib/session";
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
 * Church Admin lands on Create Intention. Staff lands here as a prayer queue.
 * Role still decides the experience — never the URL.
 *
 * Data starts in parallel with /auth/me so this is not an auth → data
 * waterfall, and the cookie's role claim decides *which* calls to start: firing
 * both sets meant every dashboard load sent the API two or three requests whose
 * only possible answer was 403. `assertChurchSession` below still decides what
 * is rendered, from the session the API returned.
 */
export default async function DashboardPage() {
  const sessionPromise = getSession();
  const claimedRole = await peekRole();
  const maybeAdmin = claimedRole !== "CHURCH_STAFF";
  const maybeStaff = claimedRole !== "CHURCH_ADMIN" && claimedRole !== "SUPER_ADMIN";

  const adminStatsP = maybeAdmin ? ignoreForbidden(getDashboardStats("")) : null;
  const scheduleP = maybeAdmin ? ignoreForbidden(getPrayerSchedule("")) : null;
  const awaitingP = maybeAdmin
    ? ignoreForbidden(getIntentions("", { paymentStatus: "PENDING_VERIFICATION", limit: 5 }))
    : null;
  const staffQueueP = maybeStaff
    ? ignoreForbidden(getStaffIntentions("", "", "queue", { limit: 100 }))
    : null;
  const staffStatsP = maybeStaff ? ignoreForbidden(getStaffStats("", "")) : null;

  const session = assertChurchSession(await sessionPromise);

  if (session.currentRole === "CHURCH_ADMIN") {
    const [stats, schedule, awaiting] = await Promise.all([
      adminStatsP ?? ignoreForbidden(getDashboardStats("")),
      scheduleP ?? ignoreForbidden(getPrayerSchedule("")),
      awaitingP ??
        ignoreForbidden(getIntentions("", { paymentStatus: "PENDING_VERIFICATION", limit: 5 })),
    ]);
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

  const [assigned, stats] = await Promise.all([
    staffQueueP ?? ignoreForbidden(getStaffIntentions("", "", "queue", { limit: 100 })),
    staffStatsP ?? ignoreForbidden(getStaffStats("", "")),
  ]);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <StaffDashboard
        session={session}
        assigned={assigned ?? undefined}
        stats={stats ?? undefined}
      />
    </Suspense>
  );
}
