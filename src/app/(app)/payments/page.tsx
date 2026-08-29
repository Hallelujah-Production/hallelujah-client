import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { FilterBar } from "@/components/data/filter-bar";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import {
  MethodBadge,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PaymentStatusBadge,
} from "@/components/ui/badge";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getPayments } from "@/lib/services";
import type { PaymentMethod, PaymentStatus, PaymentView } from "@/lib/types";
import { first, formatCurrency, formatDate, readNumberParam } from "@/lib/utils";
import { paiseToRupees } from "@/lib/api/money";

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false, follow: false },
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const query = {
    page: readNumberParam(first(params.page), 1),
    limit: 20,
    search: first(params.search),
    method: (first(params.method) ?? "ALL") as PaymentMethod | "ALL",
    status: (first(params.status) ?? "ALL") as PaymentStatus | "ALL",
    from: first(params.from),
    to: first(params.to),
    minAmount: Number(first(params.min)) || undefined,
    maxAmount: Number(first(params.max)) || undefined,
  };

  const [session, result] = await Promise.all([getSession(), getPayments("", query)]);
  const admin = assertChurchAdmin(session);

  const pendingTotal = result.paymentStats?.pendingVerification ?? 0;
  const verifiedCount = result.paymentStats?.verifiedCount ?? 0;
  const verifiedTotal = paiseToRupees(result.paymentStats?.monthCollectedPaise ?? 0);

  const columns: Column<PaymentView>[] = [
    {
      key: "reference",
      header: "Receipt reference",
      cell: (row) => <span className="tabular-nums">{row.intention?.reference ?? "—"}</span>,
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
      key: "intention",
      header: "Intention",
      hideBelow: "lg",
      cell: (row) => (
        <span>
          <span className="block">{row.prayerType?.name}</span>
          <span className="block text-xs text-muted-foreground">{row.intention?.prayerFor}</span>
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span>
      ),
    },
    { key: "method", header: "Method", cell: (row) => <MethodBadge method={row.method} /> },
    {
      key: "transaction",
      header: "Transaction ID",
      hideBelow: "xl",
      cell: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {row.transactionId ?? "Cash — no reference"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      hideBelow: "lg",
      cell: (row) => <span className="tabular-nums">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <PaymentStatusBadge status={row.status} short />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Link
          href={`/payments/${row.id}`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {row.status === "PENDING_VERIFICATION" ? "Verify" : "View"}
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Payments" }]}
        title="Payments"
        description="Offerings your parish has received, recorded against their intentions. Nothing here is collected online."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Awaiting verification"
          value={pendingTotal}
          hint="Paid, receipt after office confirmation"
          tone={pendingTotal > 0 ? "warning" : "default"}
          href="/payments?status=PENDING_VERIFICATION"
          emphasis
        />
        <StatCard
          label="Verified payments"
          value={verifiedCount}
          hint="Confirmed against parish records"
          tone="success"
          href="/payments?status=VERIFIED"
          emphasis
        />
        <StatCard
          label="Collected this month"
          value={formatCurrency(verifiedTotal)}
          hint="VERIFIED offerings in this month"
          tone="accent"
          emphasis
        />
      </StatGrid>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by receipt, transaction ID, name or mobile…"
          label="Search payments"
          className="max-w-xl"
        />
        <FilterBar
          dateRange
          filters={[
            { param: "status", label: "Payment status", options: PAYMENT_STATUS_OPTIONS },
            { param: "method", label: "Method", options: PAYMENT_METHOD_OPTIONS },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={result.data}
        caption="Payments"
        rowHref={(row) => `/payments/${row.id}`}
        empty={{
          title: "No payments found.",
          description: "Nothing matches these filters. Clear them to see every recorded offering.",
        }}
        mobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/payments/${row.id}`} className="font-medium text-foreground hover:underline">
                  {row.customer.name}
                </Link>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {row.intention?.reference}
                </p>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(row.amount)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
              <MethodBadge method={row.method} />
              <PaymentStatusBadge status={row.status} short />
            </div>
          </div>
        )}
      />

      {result.data.length ? (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          basePath="/payments"
          searchParams={params}
          itemLabel="payments"
        />
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Verification is bookkeeping: the money already reached {admin.currentChurch.name}
        {" "}directly. No payment gateway is involved at any point.
      </p>
    </div>
  );
}
