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
 * Church Admin lands on Create Intention. Staff lands here as a prayer queue.
 * Role still decides the experience — never the URL.
 *
 * Staff queue starts in parallel with /auth/me so login is not an auth → data waterfall.
 */
export default async function DashboardPage() {
  const sessionPromise = getSession();
  const adminStatsP = ignoreForbidden(getDashboardStats(""));
  const scheduleP = ignoreForbidden(getPrayerSchedule(""));
  const awaitingP = ignoreForbidden(
    getIntentions("", { paymentStatus: "PENDING_VERIFICATION", limit: 5 }),
  );
  const staffQueueP = ignoreForbidden(getStaffIntentions("", "", "queue", { limit: 100 }));
  const staffStatsP = ignoreForbidden(getStaffStats("", ""));

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

  const [assigned, stats] = await Promise.all([staffQueueP, staffStatsP]);

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
