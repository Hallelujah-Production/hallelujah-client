import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { FilterBar } from "@/components/data/filter-bar";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/guards";
import { getChurchViews, getUserCounts, getUsers } from "@/lib/services";
import type { Role, UserView } from "@/lib/types";
import { first, formatDate, readNumberParam } from "@/lib/utils";
import { UserAccountActions } from "./user-account-actions";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  CHURCH_ADMIN: "Church Admin",
  CHURCH_STAFF: "Church Staff",
};

export default async function SuperAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSuperAdmin();
  const params = await searchParams;

  const roleParam = first(params.role);
  const role: Role | "ALL" =
    roleParam === "SUPER_ADMIN" || roleParam === "CHURCH_ADMIN" || roleParam === "CHURCH_STAFF"
      ? roleParam
      : "ALL";

  const statusParam = first(params.status);
  const status = statusParam === "ACTIVE" || statusParam === "INACTIVE" ? statusParam : "ALL";

  const [result, counts, churches] = await Promise.all([
    getUsers({
      page: readNumberParam(first(params.page), 1),
      limit: 20,
      search: first(params.search),
      role,
      status,
      churchId: first(params.church) ?? "ALL",
    }),
    getUserCounts(),
    getChurchViews({ limit: 50 }),
  ]);

  const columns: Column<UserView>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground"
          >
            {row.avatarInitials}
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-foreground">{row.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => (
        <Badge
          tone={
            row.role === "SUPER_ADMIN" ? "accent" : row.role === "CHURCH_ADMIN" ? "primary" : "secondary"
          }
        >
          {ROLE_LABELS[row.role]}
        </Badge>
      ),
    },
    {
      key: "church",
      header: "Church",
      cell: (row) =>
        row.church ? (
          <Link
            href={`/super-admin/churches/${row.church.slug}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {row.church.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">Platform</span>
        ),
    },
    {
      key: "assigned",
      header: "Assigned",
      align: "right",
      hideBelow: "lg",
      cell: (row) => <span className="tabular-nums">{row.assignedCount}</span>,
    },
    {
      key: "completed",
      header: "Completed",
      align: "right",
      hideBelow: "lg",
      cell: (row) => <span className="tabular-nums">{row.completedCount}</span>,
    },
    {
      key: "created",
      header: "Created",
      hideBelow: "xl",
      cell: (row) => <span className="tabular-nums">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.invitationPending ? (
          <Badge tone="accent">Needs password</Badge>
        ) : (
          <Badge tone={row.isActive ? "success" : "neutral"}>
            <span aria-hidden="true">{row.isActive ? "✓" : "•"}</span>
            {row.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <UserAccountActions
          userId={row.id}
          userName={row.name}
          userEmail={row.email}
          isActive={row.isActive}
          invitationPending={row.invitationPending}
          isSelf={row.id === session.currentUser.id}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Platform", href: "/super-admin" }, { label: "Users" }]}
        title="Users"
        description="Every account on the platform, across all churches."
        actions={
          <ButtonLink href="/super-admin/users/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create user
          </ButtonLink>
        }
      />

      <StatGrid columns={4}>
        <StatCard label="Total users" value={counts.total} emphasis />
        <StatCard label="Church admins" value={counts.admins} tone="primary" emphasis />
        <StatCard label="Prayer staff" value={counts.staff} tone="secondary" emphasis />
        <StatCard label="Platform admins" value={counts.superAdmins} tone="accent" emphasis />
      </StatGrid>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by name, email or phone…"
          label="Search users"
          className="max-w-xl"
        />
        <FilterBar
          filters={[
            {
              param: "role",
              label: "Role",
              options: [
                { value: "SUPER_ADMIN", label: "Super Admin" },
                { value: "CHURCH_ADMIN", label: "Church Admin" },
                { value: "CHURCH_STAFF", label: "Church Staff" },
              ],
            },
            {
              param: "church",
              label: "Church",
              options: churches.data.map((c) => ({ value: c.id, label: c.name })),
            },
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
        caption="Platform users"
        empty={{
          title: "No users found.",
          description: "Clear the filters, or create an account for a church.",
          action: { label: "Create user", href: "/super-admin/users/new" },
        }}
        mobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.email}</p>
              </div>
              <Badge tone={row.invitationPending ? "accent" : row.isActive ? "success" : "neutral"}>
                {row.invitationPending ? "Needs password" : row.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
              <span className="text-muted-foreground">
                {ROLE_LABELS[row.role]} · {row.church?.name ?? "Platform"}
              </span>
              <UserAccountActions
                userId={row.id}
                userName={row.name}
                userEmail={row.email}
                isActive={row.isActive}
                invitationPending={row.invitationPending}
                isSelf={row.id === session.currentUser.id}
              />
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
          basePath="/super-admin/users"
          searchParams={params}
          itemLabel="users"
        />
      ) : null}
    </div>
  );
}
