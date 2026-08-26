import Link from "next/link";
import { CalendarCheck, CalendarDays, CheckCircle2, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import { PrayerCard } from "@/components/domain/prayer-card";
import { EmptyState } from "@/components/ui/states";
import { getStaffIntentions, getStaffStats } from "@/lib/services";
import type { ChurchSession } from "@/lib/guards";
import { formatLongDate, TODAY } from "@/lib/utils";

/**
 * Staff dashboard.
 *
 * Deliberately narrow: no revenue, no payment queue, no church settings. A
 * prayer staff member needs to know what to pray for today and what is coming.
 */
export async function StaffDashboard({ session }: { session: ChurchSession }) {
  const church = session.currentChurch;
  const staff = session.currentUser;

  const [stats, today, upcoming] = await Promise.all([
    getStaffStats(church.id, staff.id),
    getStaffIntentions(church.id, staff.id, "today", { limit: 20 }),
    getStaffIntentions(church.id, staff.id, "upcoming", { limit: 6 }),
  ]);

  const firstName = staff.name.replace(/^(Fr\.|Sr\.|Bro\.)\s/, "").split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formatLongDate(TODAY)}
        title={`Good morning, ${firstName}`}
        description={`Your prayers at ${church.name} for today, and what is coming next.`}
      />

      <StatGrid columns={4}>
        <StatCard
          label="Today's prayers"
          value={stats.today}
          icon={<CalendarCheck className="h-4 w-4" aria-hidden="true" />}
          tone="primary"
          href="/my-prayers"
          emphasis
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          hint="Due today or earlier"
          icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
          tone={stats.pending > 0 ? "warning" : "default"}
          href="/my-prayers"
          emphasis
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          hint="All time"
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          tone="success"
          href="/completed"
          emphasis
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          hint="Scheduled ahead"
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          tone="secondary"
          href="/upcoming"
          emphasis
        />
      </StatGrid>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Today&apos;s prayers
            </h2>
            <p className="text-sm text-muted-foreground">
              {today.total
                ? `You have ${today.total} prayer ${today.total === 1 ? "intention" : "intentions"} scheduled for today.`
                : "Nothing is assigned to you for today."}
            </p>
          </div>
          <Link href="/my-prayers" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            All my prayers
          </Link>
        </div>

        {today.data.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {today.data.map((intention, index) => (
              <li key={intention.id}>
                <PrayerCard
                  intention={intention}
                  href={`/my-prayers/${intention.id}`}
                  index={index}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No prayers assigned for today."
            description="When the parish office allots an intention to you it will appear here, with everything you need to offer it."
            action={{ label: "See upcoming prayers", href: "/upcoming" }}
          />
        )}
      </section>

      {upcoming.data.length ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                Coming up
              </h2>
              <p className="text-sm text-muted-foreground">
                The next {upcoming.data.length} intentions assigned to you.
              </p>
            </div>
            <Link href="/upcoming" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              View all upcoming
            </Link>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.data.map((intention, index) => (
              <li key={intention.id}>
                <PrayerCard
                  intention={intention}
                  href={`/my-prayers/${intention.id}`}
                  index={index}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
