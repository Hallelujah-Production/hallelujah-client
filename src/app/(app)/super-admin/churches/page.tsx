import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { FilterBar } from "@/components/data/filter-bar";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ChurchMark } from "@/components/layout/church-mark";
import { assertSuperAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getChurchViews } from "@/lib/services";
import type { ChurchView } from "@/lib/types";
import { first, formatCompactCurrency, formatDate, readNumberParam } from "@/lib/utils";
import { ChurchDeleteButton } from "./church-delete-button";
import { ChurchStatusToggle } from "./church-status-toggle";

export const metadata: Metadata = {
  title: "Churches",
  robots: { index: false, follow: false },
};

export default async function SuperAdminChurchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const statusParam = first(params.status);
  const status =
    statusParam === "ACTIVE" || statusParam === "INACTIVE" ? statusParam : "ALL";

  const [session, result] = await Promise.all([
    getSession(),
    getChurchViews({
      page: readNumberParam(first(params.page), 1),
      limit: 20,
      search: first(params.search),
      status,
    }),
  ]);
  assertSuperAdmin(session);

  const columns: Column<ChurchView>[] = [
    {
      key: "church",
      header: "Church",
      cell: (row) => (
        <span className="flex items-center gap-3">
          <ChurchMark initials={row.logoInitials} accent={row.accent} size="xs" />
          <span className="min-w-0">
            <span className="block font-medium text-foreground">{row.name}</span>
            <span className="block text-xs text-muted-foreground">/{row.slug}</span>
          </span>
        </span>
      ),
    },
    { key: "location", header: "Location", cell: (row) => `${row.city}, ${row.state}` },
    {
      key: "admin",
      header: "Admin",
      hideBelow: "lg",
      cell: (row) =>
        row.adminName ? (
          <span>
            <span className="block">{row.adminName}</span>
            <span className="block text-xs text-muted-foreground">{row.adminUsername}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Not assigned</span>
        ),
    },
    {
      key: "staff",
      header: "Staff",
      align: "right",
      cell: (row) => <span className="tabular-nums">{row.staffCount}</span>,
    },
    {
      key: "intentions",
      header: "Intentions",
      align: "right",
      cell: (row) => <span className="tabular-nums">{row.intentionCount}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      cell: (row) => (
        <span className="font-medium tabular-nums">{formatCompactCurrency(row.revenue)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge tone={row.isActive ? "success" : "neutral"}>
          <span aria-hidden="true">{row.isActive ? "✓" : "•"}</span>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "created",
      header: "Created",
      hideBelow: "xl",
      cell: (row) => <span className="tabular-nums">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <span className="flex items-center justify-end gap-2">
          <Link
            href={`/super-admin/churches/${row.slug}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View
          </Link>
          <ChurchStatusToggle churchId={row.id} churchName={row.name} isActive={row.isActive} />
          <ChurchDeleteButton churchId={row.id} churchName={row.name} />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Platform", href: "/super-admin" }, { label: "Churches" }]}
        title="Churches"
        description="Every parish on Hallelujah — its administrator, team, and what it has recorded."
        actions={
          <ButtonLink href="/super-admin/churches/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create church
          </ButtonLink>
        }
      />

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by church name, city or slug…"
          label="Search churches"
          className="max-w-xl"
        />
        <FilterBar
          filters={[
            {
              param: "status",
              label: "Status",
              options: [
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ],
            },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={result.data}
        caption="Churches on the platform"
        rowHref={(row) => `/super-admin/churches/${row.slug}`}
        empty={{
          title: "No churches found.",
          description: "Clear the filters, or onboard a new parish.",
          action: { label: "Create church", href: "/super-admin/churches/new" },
        }}
        mobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <ChurchMark initials={row.logoInitials} accent={row.accent} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/super-admin/churches/${row.slug}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {row.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {row.city} · {row.staffCount} staff
                </p>
              </div>
              <Badge tone={row.isActive ? "success" : "neutral"}>
                {row.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-sm">
              <span className="text-muted-foreground">{row.intentionCount} intentions</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatCompactCurrency(row.revenue)}
              </span>
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
          basePath="/super-admin/churches"
          searchParams={params}
          itemLabel="churches"
        />
      ) : null}
    </div>
  );
}
