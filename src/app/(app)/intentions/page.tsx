import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { FilterBar } from "@/components/data/filter-bar";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import {
  INTENTION_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PaymentStatusBadge,
  StatusBadge,
} from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getAssignableStaff, getIntentions, getPrayerTypes } from "@/lib/services";
import type { IntentionStatus, IntentionView, PaymentStatus } from "@/lib/types";
import { first, formatCurrency, formatDate, formatPrayerDuration, readNumberParam } from "@/lib/utils";
import { IntentionRowActions } from "./intention-row-actions";

export const metadata: Metadata = {
  title: "Prayer intentions",
  robots: { index: false, follow: false },
};

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

  const [session, result, prayerTypes, staff] = await Promise.all([
    getSession(),
    getIntentions("", {
      page,
      limit: 20,
      search,
      status,
      prayerTypeId,
      staffId,
      paymentStatus,
      from,
      to,
    }),
    getPrayerTypes(),
    getAssignableStaff(),
  ]);
  const admin = assertChurchAdmin(session);

  const columns: Column<IntentionView>[] = [
    {
      key: "reference",
      header: "Receipt",
      cell: (row) => <span className="tabular-nums">{row.reference}</span>,
    },
    {
      key: "customer",
      header: "Family",
      cell: (row) => (
        <span>
          <span className="block font-medium text-foreground">{row.customer.name}</span>
          <span className="block text-xs tabular-nums text-muted-foreground">
            {row.customer.mobile}
          </span>
        </span>
      ),
    },
    {
      key: "type",
      header: "Prayer type",
      hideBelow: "lg",
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
      align: "right",
      cell: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      hideBelow: "xl",
      cell: (row) => (
        <div className="flex flex-col items-start gap-0.5">
          <PaymentStatusBadge status={row.payment.status} short />
          {row.payment.proof ? (
            <span className="text-[0.65rem] font-medium text-muted-foreground">Proof on file</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "staff",
      header: "Assigned staff",
      hideBelow: "xl",
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
      cell: (row) => (
        <div className="flex flex-col items-start gap-0.5">
          <StatusBadge status={row.status} />
          {row.status === "COMPLETED" ? (
            <span className="text-[0.65rem] font-medium tabular-nums text-muted-foreground">
              Offered {formatPrayerDuration(row.startedAt, row.completedAt)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <IntentionRowActions
          intentionId={row.id}
          reference={row.reference}
          status={row.status}
          paymentStatus={row.payment.status}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Intentions" }]}
        title="Prayer intentions"
        description="Every intention entrusted to your parish, with its offering and its progress."
        actions={
          <ButtonLink href="/intentions/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Intention
          </ButtonLink>
        }
      />

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by receipt, name, mobile or the person prayed for…"
          label="Search intentions"
          className="max-w-xl"
        />
        <FilterBar
          dateRange
          filters={[
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
              {row.customer.name} · {formatDate(row.prayerDate)}
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
        Only intentions belonging to {admin.currentChurch.name} are listed here.
      </p>
    </div>
  );
}
