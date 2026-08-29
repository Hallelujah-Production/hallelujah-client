import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { FilterBar } from "@/components/data/filter-bar";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getReceipts } from "@/lib/services";
import type { ReceiptView } from "@/lib/types";
import { first, formatCurrency, formatDate, readNumberParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Receipts",
  robots: { index: false, follow: false },
};

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [session, result] = await Promise.all([
    getSession(),
    getReceipts("", {
      page: readNumberParam(first(params.page), 1),
      limit: 20,
      search: first(params.search),
      from: first(params.from),
      to: first(params.to),
    }),
  ]);
  assertChurchAdmin(session);

  const columns: Column<ReceiptView>[] = [
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
    { key: "prayer", header: "Prayer type", hideBelow: "lg", cell: (row) => row.prayerType.name },
    {
      key: "date",
      header: "Prayer date",
      hideBelow: "lg",
      cell: (row) => <span className="tabular-nums">{formatDate(row.intention.prayerDate)}</span>,
    },
    {
      key: "issued",
      header: "Issued",
      cell: (row) => <span className="tabular-nums">{formatDate(row.issuedAt)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.payment.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Payment",
      cell: (row) => <PaymentStatusBadge status={row.payment.status} short />,
    },
    {
      key: "authorised",
      header: "Authorised by",
      hideBelow: "xl",
      cell: (row) =>
        row.authorizedBy?.name ?? <span className="text-muted-foreground">Pending</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Link
          href={`/receipts/${row.id}`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Receipts" }]}
        title="Receipts"
        description="Every receipt your parish has issued, ready to view or print for the family."
      />

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by receipt number, name or mobile…"
          label="Search receipts"
          className="max-w-xl"
        />
        <FilterBar dateRange filters={[]} />
      </div>

      <DataTable
        columns={columns}
        rows={result.data}
        caption="Receipts issued"
        rowHref={(row) => `/receipts/${row.id}`}
        empty={{
          title: "No receipts found.",
          description:
            "An official receipt is issued after a Church Admin verifies the offering. It cannot be edited afterwards.",
        }}
        mobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/receipts/${row.id}`} className="font-medium tabular-nums text-foreground hover:underline">
                  {row.reference}
                </Link>
                <p className="text-xs text-muted-foreground">{row.customer.name}</p>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(row.payment.amount)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
              <span>{row.prayerType.name}</span>
              <PaymentStatusBadge status={row.payment.status} short />
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
          basePath="/receipts"
          searchParams={params}
          itemLabel="receipts"
        />
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
        Receipt numbers are issued once, after verification, and never reused.
        Intention references are a separate paper trail.
      </p>
    </div>
  );
}
