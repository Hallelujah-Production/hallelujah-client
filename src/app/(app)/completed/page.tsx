import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { Pagination } from "@/components/data/pagination";
import { DataTable, type Column } from "@/components/data/data-table";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import { assertChurchStaff } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getStaffIntentions, getStaffStats } from "@/lib/services";
import type { IntentionView } from "@/lib/types";
import { first, formatDate, formatDateTime, formatPrayerDuration, readNumberParam, prayerTypeNames} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Completed prayers",
  robots: { index: false, follow: false },
};

export default async function CompletedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [session, result, stats] = await Promise.all([
    getSession(),
    getStaffIntentions("", "", "completed", {
      page: readNumberParam(first(params.page), 1),
      limit: 20,
      search: first(params.search),
    }),
    getStaffStats("", ""),
  ]);
  assertChurchStaff(session);

  const columns: Column<IntentionView>[] = [
    {
      key: "reference",
      header: "Receipt",
      cell: (row) => <span className="tabular-nums">{row.reference}</span>,
    },
    { key: "type", header: "Prayer type", cell: (row) => prayerTypeNames(row) },
    { key: "for", header: "Prayer for", cell: (row) => row.prayerFor },
    {
      key: "date",
      header: "Prayer date",
      cell: (row) => <span className="tabular-nums">{formatDate(row.prayerDate)}</span>,
    },
    {
      key: "completed",
      header: "Completed at",
      hideBelow: "lg",
      align: "right",
      cell: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDateTime(row.completedAt)}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Time offered",
      align: "right",
      cell: (row) => (
        <span className="font-medium tabular-nums text-foreground">
          {formatPrayerDuration(row.startedAt, row.completedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Completed" }]}
        title="Completed prayers"
        description="Every intention you have offered, with how long you prayed and when it was marked completed."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Completed"
          value={stats.completed}
          hint="All time"
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          emphasis
        />
        <StatCard label="Still pending" value={stats.pending} tone={stats.pending ? "warning" : "default"} emphasis />
        <StatCard label="Upcoming" value={stats.upcoming} tone="secondary" emphasis />
      </StatGrid>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search completed prayers…"
          label="Search completed prayers"
          className="max-w-xl"
        />
      </div>

      <DataTable
        columns={columns}
        rows={result.data}
        caption="Completed prayers"
        rowHref={(row) => `/my-prayers/${row.id}`}
        empty={{
          title: "No completed prayers yet.",
          description: "Prayers you mark as completed will be listed here.",
          action: { label: "See today's prayers", href: "/my-prayers?scope=today" },
        }}
        mobileCard={(row) => (
          <div className="space-y-1.5">
            <Link href={`/my-prayers/${row.id}`} className="font-medium text-foreground hover:underline">
              {row.prayerFor}
            </Link>
            <p className="text-xs text-muted-foreground">
              {prayerTypeNames(row)} · {row.reference}
            </p>
            <p className="border-t border-border pt-2 text-xs text-muted-foreground">
              Offered {formatPrayerDuration(row.startedAt, row.completedAt)}
              <span className="mx-1">·</span>
              Completed {formatDateTime(row.completedAt)}
            </p>
          </div>
        )}
      />

      {result.data.length ? (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          basePath="/completed"
          searchParams={params}
          itemLabel="completed prayers"
        />
      ) : null}
    </div>
  );
}
