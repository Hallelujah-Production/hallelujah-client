import Link from "next/link";
import {
  BadgeIndianRupee,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard, StatGrid, ChartCard } from "@/components/data/stat-card";
import { DataTable, type Column } from "@/components/data/data-table";
import { TrendAreaChart, DualBarChart, RankedBarChart } from "@/components/data/charts";
import { PaymentStatusBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AssignedChurchCard } from "@/components/layout/workspace-switcher";
import { getDashboardStats, getIntentions, getPrayerSchedule } from "@/lib/services";
import type { ChurchSession } from "@/lib/guards";
import type { ChurchDashboardStats, IntentionView, Paginated } from "@/lib/types";
import { formatCompactCurrency, formatCurrency, formatLongDate, formatTime, TODAY } from "@/lib/utils";

const QUICK_ACTIONS = [
  { label: "Create Intention", href: "/intentions/new", icon: Plus },
  { label: "Add family", href: "/customers?new=1", icon: UserPlus },
  { label: "Today's Prayers", href: `/intentions?from=${TODAY}&to=${TODAY}`, icon: CalendarClock },
  { label: "Awaiting verification", href: "/payments?status=PENDING_VERIFICATION", icon: ShieldAlert },
];

export async function AdminDashboard({
  session,
  stats: statsIn,
  schedule: scheduleIn,
  awaiting: awaitingIn,
}: {
  session: ChurchSession;
  stats?: ChurchDashboardStats;
  schedule?: IntentionView[];
  awaiting?: Paginated<IntentionView>;
}) {
  const church = session.currentChurch;

  const [stats, schedule, awaiting] = await Promise.all([
    statsIn ?? getDashboardStats(church.id),
    scheduleIn ?? getPrayerSchedule(church.id),
    awaitingIn ?? getIntentions(church.id, { paymentStatus: "PENDING_VERIFICATION", limit: 5 }),
  ]);

  const parishes = stats.parishes?.length ? stats.parishes : session.assignedChurches;

  const columns: Column<IntentionView>[] = [
    {
      key: "time",
      header: "Time",
      cell: (row) => (
        <span className="font-medium tabular-nums">{formatTime(row.preferredTime)}</span>
      ),
    },
    {
      key: "type",
      header: "Prayer type",
      cell: (row) => row.prayerType.name,
    },
    {
      key: "for",
      header: "Prayer for",
      cell: (row) => (
        <span>
          <span className="block font-medium text-foreground">{row.prayerFor}</span>
          <span className="block text-xs text-muted-foreground">{row.reference}</span>
        </span>
      ),
    },
    {
      key: "staff",
      header: "Assigned staff",
      hideBelow: "lg",
      cell: (row) =>
        row.assignedStaff ? (
          row.assignedStaff.name
        ) : (
          <span className="text-muted-foreground">Not assigned</span>
        ),
    },
    {
      key: "payment",
      header: "Payment",
      hideBelow: "lg",
      cell: (row) => (
        <span className="flex flex-col items-start gap-1">
          <span className="tabular-nums">{formatCurrency(row.amount)}</span>
          <PaymentStatusBadge status={row.payment.status} short />
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formatLongDate(TODAY)}
        title={`Today at ${church.name}`}
        description="Everything your parish office needs for the day: what is scheduled, what has been collected and what is still waiting on someone."
        actions={
          <ButtonLink href="/intentions/new" size="md">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Intention
          </ButtonLink>
        }
      />

      {parishes.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              My Churches
            </h2>
            <p className="text-sm text-muted-foreground">
              Parishes allotted to you, with how many intentions have been sent, completed, and still open.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {parishes.map((parish) => (
              <li key={parish.id}>
                <AssignedChurchCard church={parish} active={parish.id === church.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Quick actions */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
              >
                <action.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Metrics */}
      <StatGrid columns={4}>
        <StatCard
          label="Today's intentions"
          value={stats.todaysIntentions}
          hint="Scheduled for today"
          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          tone="primary"
          href={`/intentions?from=${TODAY}&to=${TODAY}`}
          emphasis
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          hint="Awaiting prayer or payment"
          icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
          tone="warning"
          href="/intentions?status=PENDING_PRAYER"
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          hint="Being offered now"
          icon={<Loader2 className="h-4 w-4" aria-hidden="true" />}
          tone="secondary"
          href="/intentions?status=IN_PROGRESS"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          hint="All time"
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          tone="success"
          href="/intentions?status=COMPLETED"
        />
      </StatGrid>

      <StatGrid columns={3}>
        <StatCard
          label="Today's collection"
          value={formatCurrency(stats.todaysCollection)}
          hint="Recorded today, before verification"
          icon={<BadgeIndianRupee className="h-4 w-4" aria-hidden="true" />}
          tone="accent"
          href="/payments"
          emphasis
        />
        <StatCard
          label="Payments pending verification"
          value={stats.paymentsPendingVerification}
          hint="Waiting for your confirmation"
          icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
          tone={stats.paymentsPendingVerification > 0 ? "warning" : "default"}
          href="/payments?status=PENDING_VERIFICATION"
          emphasis
        />
        <StatCard
          label="Upcoming prayers"
          value={stats.upcomingPrayers}
          hint="Verified and scheduled ahead"
          icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
          tone="primary"
          href="/intentions"
          emphasis
        />
      </StatGrid>

      {/* Prayer schedule */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Prayer schedule
            </h2>
            <p className="text-sm text-muted-foreground">
              {schedule.length
                ? `${schedule.length} ${schedule.length === 1 ? "intention" : "intentions"} for ${formatLongDate(TODAY)}`
                : `Nothing is scheduled for ${formatLongDate(TODAY)}`}
            </p>
          </div>
          <Link
            href={`/intentions?from=${TODAY}&to=${TODAY}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View all today
          </Link>
        </div>

        <DataTable
          columns={columns}
          rows={schedule}
          caption={`Prayer schedule for ${formatLongDate(TODAY)}`}
          rowHref={(row) => `/intentions/${row.id}`}
          empty={{
            title: "No prayers are scheduled for today.",
            description: "Intentions submitted for today will appear here as soon as they are recorded.",
            action: { label: "Create an intention", href: "/intentions/new" },
          }}
          mobileCard={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/intentions/${row.id}`} className="font-medium text-foreground hover:underline">
                    {row.prayerFor}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {row.prayerType.name} · {formatTime(row.preferredTime)}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
                <span className="text-muted-foreground">
                  {row.assignedStaff?.name ?? "Not assigned"}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(row.amount)}
                  </span>
                  <PaymentStatusBadge status={row.payment.status} short />
                </span>
              </div>
            </div>
          )}
        />
      </section>

      {/* Charts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Collection trend"
          description="Verified offerings over the last 14 days"
          action={
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatCompactCurrency(stats.monthRevenue)} this month
            </span>
          }
        >
          <TrendAreaChart data={stats.revenueTrend} seriesName="Verified offerings" />
        </ChartCard>

        <ChartCard
          title="Intentions received and completed"
          description="Last 14 days"
        >
          <DualBarChart
            data={stats.intentionTrend}
            primaryName="Received"
            secondaryName="Completed"
          />
        </ChartCard>

        <ChartCard title="Most requested prayers" description="Across all time">
          <RankedBarChart data={stats.prayerTypeSplit} />
        </ChartCard>

        <ChartCard
          title="How offerings arrive"
          description="Verified payments by method"
        >
          <RankedBarChart data={stats.paymentMethodSplit} />
        </ChartCard>
      </div>

      {/* Awaiting verification */}
      {awaiting.data.length ? (
        <section className="rounded-lg border border-warning/25 bg-warning-muted/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <ShieldAlert className="h-4 w-4 text-warning" aria-hidden="true" />
                Offerings awaiting your verification
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {awaiting.total} payment{awaiting.total === 1 ? "" : "s"} recorded but not yet
                confirmed against the parish records.
              </p>
            </div>
            <ButtonLink href="/payments?status=PENDING_VERIFICATION" variant="outline" size="sm">
              Review payments
            </ButtonLink>
          </div>

          <ul className="mt-4 divide-y divide-border border-t border-border">
            {awaiting.data.map((intention) => (
              <li key={intention.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <Link
                    href={`/payments/${intention.paymentId}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {intention.reference}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {intention.customer.name} · {intention.prayerType.name}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(intention.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
