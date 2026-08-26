import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import { requireSuperAdmin } from "@/lib/guards";
import { getPrayerTypes, getPrayerTypeUsage } from "@/lib/services";
import type { PrayerType } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { CreatePrayerTypeForm, PrayerTypeStatusToggle } from "./prayer-type-forms";

export const metadata: Metadata = {
  title: "Prayer types",
  robots: { index: false, follow: false },
};

export default async function PrayerTypesPage() {
  await requireSuperAdmin();

  const [types, usage] = await Promise.all([getPrayerTypes(true), getPrayerTypeUsage()]);
  const totalUse = Object.values(usage).reduce((a, b) => a + b, 0);

  const columns: Column<PrayerType>[] = [
    {
      key: "name",
      header: "Prayer type",
      cell: (row) => (
        <span className="flex items-center gap-3">
          <PrayerIcon icon={row.icon} index={types.indexOf(row)} size="sm" />
          <span className="min-w-0">
            <span className="block font-medium text-foreground">{row.name}</span>
            <span className="block text-xs text-muted-foreground">{row.code}</span>
          </span>
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      hideBelow: "lg",
      cell: (row) => <span className="text-muted-foreground">{row.description}</span>,
    },
    {
      key: "amount",
      header: "Customary offering",
      align: "right",
      cell: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.suggestedAmount)}</span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      hideBelow: "lg",
      cell: (row) => <span className="tabular-nums">{row.durationMinutes} min</span>,
    },
    {
      key: "usage",
      header: "Recorded",
      align: "right",
      cell: (row) => <span className="tabular-nums">{usage[row.id] ?? 0}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (row) => (
        <div className="flex flex-col items-end gap-2">
          <Badge tone={row.isActive ? "success" : "neutral"}>
            <span aria-hidden="true">{row.isActive ? "✓" : "•"}</span>
            {row.isActive ? "Active" : "Retired"}
          </Badge>
          <PrayerTypeStatusToggle type={row} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Platform", href: "/super-admin" }, { label: "Prayer types" }]}
        title="Prayer types"
        description="The catalogue every church draws from. Keeping it central is what makes reporting comparable across parishes."
      />

      <StatGrid columns={3}>
        <StatCard label="Prayer types" value={types.length} emphasis />
        <StatCard
          label="Active"
          value={types.filter((t) => t.isActive).length}
          tone="success"
          emphasis
        />
        <StatCard
          label="Intentions recorded"
          value={totalUse.toLocaleString("en-IN")}
          tone="accent"
          emphasis
        />
      </StatGrid>

      <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        The amounts here are customary offerings shown to families as guidance. Each church
        records the amount it actually receives, which may differ.
      </p>

      <CreatePrayerTypeForm />

      <DataTable
        columns={columns}
        rows={types}
        caption="Platform prayer type catalogue"
        empty={{ title: "No prayer types in the catalogue." }}
        mobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <PrayerIcon icon={row.icon} index={types.indexOf(row)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-sm">
              <span className="tabular-nums text-muted-foreground">
                {usage[row.id] ?? 0} recorded
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {formatCurrency(row.suggestedAmount)}
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
