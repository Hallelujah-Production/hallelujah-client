import type { Metadata } from "next";
import { Suspense } from "react";
import { requireChurchSession } from "@/lib/guards";
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
 */
export default async function DashboardPage() {
  const session = await requireChurchSession();

  return (
    <Suspense fallback={<DashboardLoading />}>
      {session.currentRole === "CHURCH_ADMIN" ? (
        <AdminDashboard session={session} />
      ) : (
        <StaffDashboard session={session} />
      )}
    </Suspense>
  );
}
