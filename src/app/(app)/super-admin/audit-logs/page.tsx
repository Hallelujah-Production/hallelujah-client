import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { FilterBar } from "@/components/data/filter-bar";
import { DataTable, type Column } from "@/components/data/data-table";
import { Pagination } from "@/components/data/pagination";
import { Badge } from "@/components/ui/badge";
import { assertSuperAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getAuditActions, getAuditLogs, getChurchViews } from "@/lib/services";
import type { AuditLog } from "@/lib/types";
import { first, formatDateTime, readNumberParam, titleCase } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Audit logs",
  robots: { index: false, follow: false },
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [session, result, actions, churches] = await Promise.all([
    getSession(),
    getAuditLogs({
      page: readNumberParam(first(params.page), 1),
      limit: 20,
      search: first(params.search),
      action: first(params.action) ?? "ALL",
      churchId: first(params.church) ?? "ALL",
    }),
    getAuditActions(),
    getChurchViews({ limit: 50 }),
  ]);
  assertSuperAdmin(session);

  const churchName = (id: string | null) =>
    id ? (churches.data.find((c) => c.id === id)?.name ?? "—") : "Platform";

  const columns: Column<AuditLog>[] = [
    {
      key: "time",
      header: "When",
      cell: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => <Badge tone="primary">{titleCase(row.action)}</Badge>,
    },
    {
      key: "summary",
      header: "Summary",
      cell: (row) => <span className="text-foreground">{row.summary}</span>,
    },
    {
      key: "actor",
      header: "Actor",
      hideBelow: "lg",
      cell: (row) => row.actorName,
    },
    {
      key: "church",
      header: "Church",
      hideBelow: "lg",
      cell: (row) => churchName(row.churchId),
    },
    {
      key: "ip",
      header: "IP address",
      hideBelow: "xl",
      align: "right",
      cell: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground">{row.ipAddress}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Platform", href: "/super-admin" }, { label: "Audit logs" }]}
        title="Audit logs"
        description="The backend writes an audit row for every privileged action. A list API is not part of the current HTTP contract, so this screen stays empty until that endpoint exists."
      />

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by summary, actor or record id…"
          label="Search audit logs"
          className="max-w-xl"
        />
        <FilterBar
          filters={[
            {
              param: "action",
              label: "Action",
              options: actions.map((a) => ({ value: a, label: titleCase(a) })),
            },
            {
              param: "church",
              label: "Church",
              options: churches.data.map((c) => ({ value: c.id, label: c.name })),
            },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={result.data}
        caption="Platform audit log"
        empty={{
          title: "Audit history is not available in this workspace yet.",
          description:
            "Privileged actions are still recorded by the API. This page does not invent a frontend-only log.",
        }}
        mobileCard={(row) => (
          <div className="space-y-1.5">
            <Badge tone="primary">{titleCase(row.action)}</Badge>
            <p className="text-sm text-foreground">{row.summary}</p>
            <p className="border-t border-border pt-2 text-xs text-muted-foreground">
              {row.actorName} · {churchName(row.churchId)} · {formatDateTime(row.createdAt)}
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
          basePath="/super-admin/audit-logs"
          searchParams={params}
          itemLabel="entries"
        />
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
        In the connected application these entries are append-only and written by the
        backend, not by the interface.
      </p>
    </div>
  );
}
