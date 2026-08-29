import { StaffPrayerQueue } from "@/components/domain/staff-prayer-queue";
import { getStaffIntentions, getStaffStats } from "@/lib/services";
import type { ChurchSession } from "@/lib/guards";
import type { IntentionView, Paginated, StaffDashboardStats } from "@/lib/types";

/**
 * Staff dashboard is the tablet prayer workstation.
 * My Prayers / Upcoming / Completed stay in navigation for lists and history.
 */
export async function StaffDashboard({
  session,
  assigned: assignedIn,
  stats: statsIn,
}: {
  session: ChurchSession;
  assigned?: Paginated<IntentionView>;
  stats?: StaffDashboardStats;
}) {
  const church = session.currentChurch;
  const staff = session.currentUser;

  const [assigned, stats] = await Promise.all([
    assignedIn ?? getStaffIntentions(church.id, staff.id, "queue", { limit: 100 }),
    statsIn ?? getStaffStats(church.id, staff.id),
  ]);

  return (
    <StaffPrayerQueue churchName={church.name} assigned={assigned.data} stats={stats} />
  );
}
