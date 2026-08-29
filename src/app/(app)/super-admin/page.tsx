import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeIndianRupee,
  Building2,
  CheckCircle2,
  Plus,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard, StatGrid, ChartCard } from "@/components/data/stat-card";
import { TrendAreaChart, DualBarChart, RankedBarChart, SplitDonutChart } from "@/components/data/charts";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { assertSuperAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getPlatformStats, getRecentActivity, getChurchViews } from "@/lib/services";
import { formatCompactCurrency, formatCurrency, relativeTime } from "@/lib/utils";
import type { TrendPoint } from "@/lib/types";
import SuperAdminLoading from "./loading";

export const metadata: Metadata = {
  title: "Platform dashboard",
  robots: { index: false, follow: false },
};

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CHURCH_CREATED: Building2,
  CHURCH_ACTIVATED: Building2,
  CHURCH_DEACTIVATED: Building2,
  ADMIN_ASSIGNED: UserCog,
  USER_CREATED: Users,
  INTENTION_CREATED: Sparkles,
  PAYMENT_VERIFIED: BadgeIndianRupee,
  PRAYER_COMPLETED: CheckCircle2,
};

function hasValues(series: TrendPoint[]): boolean {
  return series.some((point) => point.value > 0 || (point.secondary ?? 0) > 0);
}

export default async function SuperAdminDashboard() {
  const sessionPromise = getSession();
  const statsP = getPlatformStats();
  const activityP = getRecentActivity(8);
  const churchesP = getChurchViews({ limit: 6 });

  const session = assertSuperAdmin(await sessionPromise);
  const firstName = session.currentUser.name.split(" ")[0] || session.currentUser.name;
  return (
    <Suspense fallback={<SuperAdminLoading />}>
      <SuperAdminDashboardBody firstName={firstName} statsP={statsP} activityP={activityP} churchesP={churchesP} />
    </Suspense>
  );
}

async function SuperAdminDashboardBody({
  firstName,
  statsP,
  activityP,
  churchesP,
}: {
  firstName: string;
  statsP: ReturnType<typeof getPlatformStats>;
  activityP: ReturnType<typeof getRecentActivity>;
  churchesP: ReturnType<typeof getChurchViews>;
}) {
  const [stats, activity, churches] = await Promise.all([statsP, activityP, churchesP]);
  const isFresh = stats.totalChurches === 0;
  const showCharts =
    hasValues(stats.revenueTrend) ||
    hasValues(stats.intentionTrend) ||
    hasValues(stats.churchPerformance) ||
    hasValues(stats.completionSplit);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Hallelujah"
        title={`Welcome, ${firstName}`}
        description="Oversee every parish on the platform — churches, people, intentions and recorded offerings."
        actions={
          <ButtonLink href="/super-admin/churches/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create church
          </ButtonLink>
        }
      />

      {isFresh ? <FirstRunCard /> : null}

      <StatGrid columns={4}>
        <StatCard
          label="Churches"
          value={stats.totalChurches}
          hint={isFresh ? "None onboarded yet" : `${stats.activeChurches} active`}
          icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
          tone="primary"
          href="/super-admin/churches"
          emphasis
        />
        <StatCard
          label="Users"
          value={stats.totalUsers}
          hint={`${stats.totalAdmins} admins · ${stats.totalStaff} staff`}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          href="/super-admin/users"
          emphasis
        />
        <StatCard
          label="Intentions"
          value={stats.totalIntentions.toLocaleString("en-IN")}
          hint={stats.pending > 0 ? `${stats.pending} in workflow` : "This month"}
          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          emphasis
        />
        <StatCard
          label="Offerings recorded"
          value={formatCompactCurrency(stats.totalRevenue)}
          hint={`${formatCurrency(stats.todaysRevenue)} today`}
          icon={<BadgeIndianRupee className="h-4 w-4" aria-hidden="true" />}
          tone="accent"
          emphasis
        />
      </StatGrid>

      {!isFresh ? (
        <nav aria-label="Quick actions" className="grid gap-3 sm:grid-cols-3">
          <QuickLink href="/super-admin/churches/new" title="Add a church" text="Onboard a parish and assign its administrator." />
          <QuickLink href="/super-admin/users/new" title="Add a user" text="Create a Super Admin, church admin or staff account." />
          <QuickLink href="/super-admin/prayer-types" title="Prayer types" text="Keep the catalogue churches offer to families." />
        </nav>
      ) : null}

      {showCharts ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard title="Offerings recorded" description="Verified offerings across all churches">
            <TrendAreaChart data={stats.revenueTrend} seriesName="Verified offerings" />
          </ChartCard>
          <ChartCard title="Intentions" description="Received and completed this month">
            <DualBarChart
              data={stats.intentionTrend}
              primaryName="Received"
              secondaryName="Completed"
            />
          </ChartCard>
          {hasValues(stats.churchPerformance) ? (
            <ChartCard title="Church performance" description="Verified offerings by church">
              <RankedBarChart data={stats.churchPerformance} variant="currency" />
            </ChartCard>
          ) : null}
          {hasValues(stats.completionSplit) ? (
            <ChartCard title="Completion" description="Where intentions stand this month">
              <SplitDonutChart data={stats.completionSplit} />
            </ChartCard>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
              Churches
            </h2>
            <Link
              href="/super-admin/churches"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </header>
          {churches.data.length ? (
            <ul className="divide-y divide-border">
              {churches.data.map((church) => (
                <li key={church.id}>
                  <Link
                    href={`/super-admin/churches/${church.slug}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{church.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {church.city} · {church.intentionCount} intentions · {church.staffCount} staff
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">
                      {formatCompactCurrency(church.revenue)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                title="No churches yet"
                description="Create the first parish. Families can submit intentions only after a church is live."
                action={{ label: "Create church", href: "/super-admin/churches/new" }}
                className="border-0 bg-transparent py-8"
              />
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground">
              <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Recent activity
            </h2>
            <Link
              href="/super-admin/audit-logs"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Audit logs
            </Link>
          </header>
          {activity.length ? (
            <ul className="divide-y divide-border">
              {activity.map((entry) => {
                const Icon = ACTIVITY_ICONS[entry.action] ?? Activity;
                return (
                  <li key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-foreground">{entry.summary}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entry.actorName} · {relativeTime(entry.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-5 py-10 text-sm leading-relaxed text-muted-foreground">
              Activity will appear here as churches are created and staff begin recording
              intentions.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function FirstRunCard() {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-l-4 border-accent px-5 py-5 sm:px-6">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-accent">
          Get started
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">
          The platform is empty
        </h2>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Create the first church, then add its administrator. Families will see that parish
          in the public directory and can submit prayer intentions there.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          <li className="rounded-md border border-border bg-muted/40 px-3.5 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 1
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">Create a church</p>
          </li>
          <li className="rounded-md border border-border bg-muted/40 px-3.5 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 2
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">Add a church admin</p>
          </li>
          <li className="rounded-md border border-border bg-muted/40 px-3.5 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 3
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">Families can submit</p>
          </li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href="/super-admin/churches/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create first church
          </ButtonLink>
          <ButtonLink href="/super-admin/users/new" variant="outline">
            Add a user
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function QuickLink({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <p className="flex items-center justify-between gap-2 font-display text-sm font-semibold text-foreground">
        {title}
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </Link>
  );
}
