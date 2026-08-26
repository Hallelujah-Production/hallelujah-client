import type { Metadata } from "next";
import { PageHeader, TabNav } from "@/components/layout/page-header";
import { FilterBar } from "@/components/data/filter-bar";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/components/ui/badge";
import { ReportView } from "@/components/domain/report-view";
import { ReportRetry } from "@/components/domain/report-retry";
import { PrintButton } from "@/components/domain/print-button";
import { requireChurchAdmin } from "@/lib/guards";
import { getPrayerTypes, getReport, resolveRange, type ReportPreset } from "@/lib/services";
import { first, formatDate, reportRangeMessage } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

const PRESETS: { value: ReportPreset; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Date range" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireChurchAdmin();
  const params = await searchParams;

  const presetParam = first(params.preset) as ReportPreset | undefined;
  const preset: ReportPreset =
    presetParam && ["daily", "weekly", "monthly", "custom"].includes(presetParam)
      ? presetParam
      : "monthly";

  const range = resolveRange(preset, first(params.from), first(params.to));
  const rangeError =
    preset === "custom" ? reportRangeMessage(first(params.from), first(params.to)) : null;

  const prayerTypes = await getPrayerTypes();
  let report = null;
  let loadFailed = false;
  if (!rangeError) {
    try {
      report = await getReport({
        from: range.from,
        to: range.to,
        churchId: session.currentChurch.id,
        prayerTypeId: first(params.type),
        method: first(params.method),
        paymentStatus: first(params.payment),
        preset,
      });
    } catch {
      loadFailed = true;
    }
  }

  const buildHref = (value: ReportPreset) => {
    const next = new URLSearchParams();
    for (const [key, raw] of Object.entries(params)) {
      const v = Array.isArray(raw) ? raw[0] : raw;
      if (!v || key === "preset") continue;
      if (value !== "custom" && (key === "from" || key === "to")) continue;
      next.set(key, v);
    }
    if (value !== "monthly") next.set("preset", value);
    const qs = next.toString();
    return qs ? `/reports?${qs}` : "/reports";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]}
        title="Reports"
        description={`${range.label} · ${formatDate(range.from)} to ${formatDate(range.to)} · ${session.currentChurch.name}`}
        actions={<PrintButton size="sm" variant="outline" label="Print report" />}
      />

      <TabNav
        items={PRESETS.map((item) => ({
          label: item.label,
          href: buildHref(item.value),
          active: preset === item.value,
        }))}
      />

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <FilterBar
          dateRange={preset === "custom"}
          filters={[
            {
              param: "type",
              label: "Prayer type",
              options: prayerTypes.map((t) => ({ value: t.id, label: t.name })),
            },
            { param: "method", label: "Payment method", options: PAYMENT_METHOD_OPTIONS },
            { param: "payment", label: "Payment status", options: PAYMENT_STATUS_OPTIONS },
          ]}
        />
        {preset !== "custom" ? (
          <p className="text-xs text-muted-foreground">
            Choose <span className="font-medium text-foreground">Date range</span> above to
            report on a specific period.
          </p>
        ) : null}
      </div>

      {loadFailed ? <ReportRetry /> : report ? <ReportView report={report} range={range} /> : null}
    </div>
  );
}
