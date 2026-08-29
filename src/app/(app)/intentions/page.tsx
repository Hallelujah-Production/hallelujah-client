import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LiveRefresh } from "@/components/data/live-refresh";
import { SearchInput } from "@/components/data/search-input";
import { FilterBar } from "@/components/data/filter-bar";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import {
  INTENTION_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PaymentStatusBadge,
  StatusBadge,
} from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getAssignableStaff, getIntentionRegister, getPrayerTypes } from "@/lib/services";
import type { IntentionQuery, IntentionStatus, IntentionView, PaymentStatus } from "@/lib/types";
import { first, formatCurrency, formatDate, formatPrayerDuration, readNumberParam } from "@/lib/utils";
import { IntentionRowActions } from "./intention-row-actions";

export const metadata: Metadata = {
  title: "Prayer intentions",
  robots: { index: false, follow: false },
};

const PROGRESS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
];

export default async function IntentionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const page = readNumberParam(first(params.page), 1);
  const search = first(params.search);
  const status = (first(params.status) ?? "ALL") as IntentionStatus | "ALL";
  const prayerTypeId = first(params.type) ?? "ALL";
  const staffId = first(params.staff) ?? "ALL";
  const paymentStatus = (first(params.payment) ?? "ALL") as PaymentStatus | "ALL";
  const from = first(params.from);
  const to = first(params.to);
  const progress = (first(params.progress) as IntentionQuery["progress"]) ?? "ALL";
  const parishId = first(params.parish);

  const shared = {
    search,
    prayerTypeId,
    staffId,
    paymentStatus,
    from,
    to,
    parishId,
  };

  const [session, result, pending, completed, all, prayerTypes, staff] = await Promise.all([
    getSession(),
    getIntentionRegister({
      ...shared,
      page,
      limit: 20,
      status,
      progress,
    }),
    getIntentionRegister({ ...shared, status, progress: "PENDING", countsOnly: true, limit: 1 }),
    getIntentionRegister({ ...shared, status, progress: "COMPLETED", countsOnly: true, limit: 1 }),
    getIntentionRegister({ ...shared, status, progress: "ALL", countsOnly: true, limit: 1 }),
    getPrayerTypes(),
    getAssignableStaff(),
  ]);
  const admin = assertChurchAdmin(session);
  const allottedChurches = admin.assignedChurches.length
    ? admin.assignedChurches
    : [admin.currentChurch];
  const pendingCount = pending.total;
  const completedCount = completed.total;
  const allCount = all.total;

  const columns: Column<IntentionView>[] = [
    {
      key: "reference",
      header: "Receipt",
      cell: (row) => <span className="font-medium tabular-nums">{row.reference}</span>,
    },
    {
      key: "church",
      header: "Church",
      cell: (row) => row.church?.name || admin.currentChurch.name,
    },
    {
      key: "customer",
      header: "Family",
      cell: (row) => (
        <span className="block">
          <span className="block font-medium text-foreground">{row.customer.name}</span>
          <span className="block text-xs tabular-nums text-muted-foreground">
            {row.customer.mobile ?? "—"}
          </span>
        </span>
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
      cell: (row) => row.prayerFor,
    },
    {
      key: "date",
      header: "Prayer date",
      cell: (row) => <span className="tabular-nums">{formatDate(row.prayerDate)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: "created",
      header: "Created by",
      cell: (row) => (
        <span className="block">
          <span className="block text-foreground">
            {row.createdByName ?? (row.source === "PUBLIC" ? "Public page" : "—")}
          </span>
          <span className="block text-xs tabular-nums text-muted-foreground">
            {formatDate(row.createdAt)}
          </span>
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      cell: (row) => <PaymentStatusBadge status={row.payment.status} short />,
    },
    {
      key: "staff",
      header: "Assigned staff",
      cell: (row) =>
        row.assignedStaff ? (
          row.assignedStaff.name
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Link
          href={`/intentions/${row.id}`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open
        </Link>
      ),
    },
  ];

  const allHref = progressHref(params, "ALL");
  const pendingHref = progressHref(params, "PENDING");
  const completedHref = progressHref(params, "COMPLETED");

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Intentions" }]}
        title="Prayer intentions"
        description="Intentions from every parish allotted to you: which church, who created them, and whether prayer is still pending."
        actions={
          <ButtonLink href="/intentions/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Intention
          </ButtonLink>
        }
      />

      <StatGrid columns={3}>
        <StatCard label="All" value={allCount} href={allHref} tone="primary" emphasis={progress === "ALL"} />
        <StatCard
          label="Pending"
          value={pendingCount}
          href={pendingHref}
          tone="warning"
          hint="Not yet completed"
          emphasis={progress === "PENDING"}
        />
        <StatCard
          label="Completed"
          value={completedCount}
          href={completedHref}
          tone="success"
          hint="Prayer offered"
          emphasis={progress === "COMPLETED"}
        />
      </StatGrid>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by receipt, name, mobile or the person prayed for…"
          label="Search intentions"
          className="max-w-xl"
        />
        <FilterBar
          dateRange
          filters={[
            ...(allottedChurches.length > 1
              ? [
                  {
                    param: "parish",
                    label: "Church",
                    options: allottedChurches.map((church) => ({
                      value: church.id,
                      label: church.name,
                    })),
                  },
                ]
              : []),
            { param: "progress", label: "Progress", options: PROGRESS_OPTIONS },
            { param: "status", label: "Status", options: INTENTION_STATUS_OPTIONS },
            {
              param: "type",
              label: "Prayer type",
              options: prayerTypes.map((t) => ({ value: t.id, label: t.name })),
            },
            {
              param: "staff",
              label: "Assigned to",
              options: [
                { value: "UNASSIGNED", label: "Unassigned" },
                ...staff.map((s) => ({ value: s.id, label: s.name })),
              ],
            },
            { param: "payment", label: "Payment", options: PAYMENT_STATUS_OPTIONS },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={result.data}
        caption="Prayer intentions"
        rowHref={(row) => `/intentions/${row.id}`}
        empty={{
          title: "No prayer intentions found.",
          description:
            "Nothing matches these filters yet. Clear them, or record an intention taken at the counter.",
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
                  {row.reference} · {row.prayerType.name}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {row.church?.name || admin.currentChurch.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {row.customer.name} · {formatDate(row.prayerDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              Created by {row.createdByName ?? (row.source === "PUBLIC" ? "Public page" : "—")}
            </p>
            {row.status === "COMPLETED" ? (
              <p className="text-xs font-medium tabular-nums text-foreground">
                Time offered {formatPrayerDuration(row.startedAt, row.completedAt)}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
              <span className="font-medium tabular-nums text-foreground">
                {formatCurrency(row.amount)}
              </span>
              <PaymentStatusBadge status={row.payment.status} short />
            </div>
            <IntentionRowActions
              intentionId={row.id}
              reference={row.reference}
              status={row.status}
              paymentStatus={row.payment.status}
            />
          </div>
        )}
      />

      {result.data.length ? (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          basePath="/intentions"
          searchParams={params}
          itemLabel="intentions"
        />
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Showing every parish allotted to you
        {allottedChurches.length > 1 ? ". Use the Church filter to focus on one" : ""}. Create
        Intention still records against {admin.currentChurch.name}.
      </p>
    </div>
  );
}

function progressHref(
  params: Record<string, string | string[] | undefined>,
  progress: "ALL" | "PENDING" | "COMPLETED",
): string {
  const query = new URLSearchParams();
  for (const key of ["search", "status", "type", "staff", "payment", "from", "to", "parish"] as const) {
    const value = first(params[key]);
    if (value) query.set(key, value);
  }
  if (progress !== "ALL") query.set("progress", progress);
  const qs = query.toString();
  return qs ? `/intentions?${qs}` : "/intentions";
}
