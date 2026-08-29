import Link from "next/link";
import { Download, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LiveRefresh } from "@/components/data/live-refresh";
import { SearchInput } from "@/components/data/search-input";
import { FilterBar } from "@/components/data/filter-bar";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import { PrayerDurationText } from "@/components/domain/prayer-elapsed-timer";
import { PaymentStatusBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type { Church, IntentionView, Paginated } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

const PROGRESS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
];

export function MyChurchesRegister({
  result,
  churches,
  params,
  basePath,
  exportPath,
  currentChurchId,
  breadcrumbHome,
  description = "Every intention across the parishes allotted to you: who created it, for whom, which church, and whether prayer is still pending or completed.",
  footnote = "This register lists every allotted parish. The dashboard My Churches cards are unchanged.",
}: {
  result: Paginated<IntentionView>;
  churches: Pick<Church, "id" | "name">[];
  params: Record<string, string | string[] | undefined>;
  basePath: string;
  exportPath: string;
  currentChurchId?: string | null;
  breadcrumbHome: { label: string; href: string };
  description?: string;
  footnote?: string;
}) {
  const exportHref = (() => {
    const query = new URLSearchParams();
    for (const [key, raw] of Object.entries(params)) {
      if (key === "page") continue;
      const value = Array.isArray(raw) ? raw[0] : raw;
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `${exportPath}?${qs}` : exportPath;
  })();

  const columns: Column<IntentionView>[] = [
    {
      key: "reference",
      header: "Receipt",
      cell: (row) => <span className="tabular-nums">{row.reference}</span>,
    },
    {
      key: "church",
      header: "Church",
      cell: (row) => row.church.name || "—",
    },
    {
      key: "created",
      header: "Created",
      hideBelow: "xl",
      cell: (row) => (
        <span>
          <span className="block tabular-nums text-foreground">{formatDate(row.createdAt)}</span>
          <span className="block text-xs text-muted-foreground">
            {row.createdByName ?? (row.source === "PUBLIC" ? "Public page" : "—")}
          </span>
        </span>
      ),
    },
    {
      key: "family",
      header: "Family",
      cell: (row) => (
        <span>
          <span className="block font-medium text-foreground">{row.customer.name}</span>
          <span className="block text-xs tabular-nums text-muted-foreground">
            {row.customer.mobile ?? "—"}
          </span>
        </span>
      ),
    },
    {
      key: "for",
      header: "Prayer for",
      cell: (row) => (
        <span>
          <span className="block text-foreground">{row.prayerFor}</span>
          <span className="block text-xs text-muted-foreground">{row.prayerType.name}</span>
        </span>
      ),
    },
    {
      key: "date",
      header: "Prayer date",
      cell: (row) => <span className="tabular-nums">{formatDate(row.prayerDate)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      hideBelow: "lg",
      cell: (row) => <span className="tabular-nums">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "progress",
      header: "Progress",
      cell: (row) => (
        <div className="flex flex-col items-start gap-0.5">
          <StatusBadge status={row.status} />
          {row.status === "COMPLETED" || row.status === "IN_PROGRESS" ? (
            <span className="text-[0.65rem] font-medium tabular-nums text-muted-foreground">
              {row.status === "COMPLETED" ? "Offered " : "Offering "}
              <PrayerDurationText
                status={row.status}
                startedAt={row.startedAt}
                completedAt={row.completedAt}
              />
            </span>
          ) : row.completedAt ? (
            <span className="text-[0.65rem] text-muted-foreground">
              Completed {formatDate(row.completedAt)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      hideBelow: "xl",
      cell: (row) => <PaymentStatusBadge status={row.payment.status} short />,
    },
    {
      key: "staff",
      header: "Assigned",
      hideBelow: "xl",
      cell: (row) =>
        row.assignedStaff ? (
          row.assignedStaff.name
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <PageHeader
        breadcrumb={[breadcrumbHome, { label: "My Churches" }]}
        title="My Churches"
        description={description}
        actions={
          <ButtonLink href={exportHref} variant="outline">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download CSV
          </ButtonLink>
        }
      />

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by receipt, family, mobile or the person prayed for…"
          label="Search intentions"
          className="max-w-xl"
        />
        <FilterBar
          dateRange
          filters={[
            {
              param: "parish",
              label: "Church",
              options: churches.map((church) => ({ value: church.id, label: church.name })),
            },
            { param: "progress", label: "Progress", options: PROGRESS_OPTIONS },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Date range filters by prayer date. CSV downloads the filtered list, not only this page.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={result.data}
        caption="My Churches intention register"
        rowHref={(row) =>
          currentChurchId && row.churchId === currentChurchId ? `/intentions/${row.id}` : undefined
        }
        empty={{
          title: "No intentions match these filters.",
          description: "Clear the church, dates or pending/completed filter to see more of the register.",
        }}
        mobileCard={(row) => {
          const href =
            currentChurchId && row.churchId === currentChurchId ? `/intentions/${row.id}` : undefined;
          const title = href ? (
            <Link href={href} className="font-medium text-foreground hover:underline">
              {row.prayerFor}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{row.prayerFor}</span>
          );
          return (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {title}
                  <p className="text-xs text-muted-foreground">
                    {row.reference} · {row.church.name}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {row.customer.name} · {formatDate(row.prayerDate)}
              </p>
              <p className="text-xs text-muted-foreground">
                Created {formatDateTime(row.createdAt)}
                {row.createdByName ? ` · ${row.createdByName}` : ""}
              </p>
              {row.status === "COMPLETED" || row.status === "IN_PROGRESS" ? (
                <p className="text-xs font-medium tabular-nums text-foreground">
                  {row.status === "COMPLETED" ? "Time offered " : "Offering "}
                  <PrayerDurationText
                    status={row.status}
                    startedAt={row.startedAt}
                    completedAt={row.completedAt}
                  />
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(row.amount)}
                </span>
                <PaymentStatusBadge status={row.payment.status} short />
              </div>
            </div>
          );
        }}
      />

      {result.data.length ? (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          basePath={basePath}
          searchParams={params}
          itemLabel="intentions"
        />
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {footnote}
      </p>
    </div>
  );
}
