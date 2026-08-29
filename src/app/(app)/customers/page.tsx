import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import { ButtonLink } from "@/components/ui/button";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getCustomers } from "@/lib/services";
import type { CustomerView } from "@/lib/types";
import { first, formatCurrency, formatDate, readNumberParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Families",
  robots: { index: false, follow: false },
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [session, result] = await Promise.all([
    getSession(),
    getCustomers("", {
      page: readNumberParam(first(params.page), 1),
      limit: 20,
      search: first(params.search),
    }),
  ]);
  const admin = assertChurchAdmin(session);

  const columns: Column<CustomerView>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => row.name,
    },
    {
      key: "mobile",
      header: "Mobile",
      cell: (row) => <span className="tabular-nums">{row.mobile}</span>,
    },
    {
      key: "email",
      header: "Email",
      hideBelow: "lg",
      cell: (row) => row.email ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "intentions",
      header: "Total intentions",
      align: "right",
      cell: (row) => <span className="tabular-nums">{row.totalIntentions}</span>,
    },
    {
      key: "paid",
      header: "Total paid",
      align: "right",
      cell: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.totalPaid)}</span>
      ),
    },
    {
      key: "last",
      header: "Last prayer",
      hideBelow: "lg",
      cell: (row) => (
        <span className="tabular-nums">{row.lastPrayerDate ? formatDate(row.lastPrayerDate) : "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Link
          href={`/customers/${row.id}`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Families" }]}
        title="Families"
        description="Families and individuals who have entrusted an intention to your parish."
        actions={
          <ButtonLink href="/intentions/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New intention
          </ButtonLink>
        }
      />

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by name, mobile or email…"
          label="Search families"
          className="max-w-xl"
        />
      </div>

      <DataTable
        columns={columns}
        rows={result.data}
        caption="Families"
        rowHref={(row) => `/customers/${row.id}`}
        empty={{
          title: "No families found.",
          description:
            "A family record is created the first time someone submits an intention to your church.",
          action: { label: "Create an intention", href: "/intentions/new" },
        }}
        mobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/customers/${row.id}`} className="font-medium text-foreground hover:underline">
                  {row.name}
                </Link>
                <p className="text-xs tabular-nums text-muted-foreground">{row.mobile}</p>
              </div>
              <span className="text-sm font-medium tabular-nums text-foreground">
                {formatCurrency(row.totalPaid)}
              </span>
            </div>
            <p className="border-t border-border pt-2 text-xs text-muted-foreground">
              {row.totalIntentions} {row.totalIntentions === 1 ? "intention" : "intentions"}
              {row.lastPrayerDate ? ` · last ${formatDate(row.lastPrayerDate)}` : ""}
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
          basePath="/customers"
          searchParams={params}
          itemLabel="families"
        />
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        Family records belong to {admin.currentChurch.name} alone and are not shared
        between churches.
      </p>
    </div>
  );
}
