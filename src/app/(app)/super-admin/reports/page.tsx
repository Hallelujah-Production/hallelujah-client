import type { Metadata } from "next";
import { PageHeader, TabNav } from "@/components/layout/page-header";
import { FilterBar } from "@/components/data/filter-bar";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/components/ui/badge";
import { ReportView } from "@/components/domain/report-view";
import { ReportRetry } from "@/components/domain/report-retry";
import { PrintButton } from "@/components/domain/print-button";
import { requireSuperAdmin } from "@/lib/guards";
import {
  getChurchViews,
  getPrayerTypes,
  getReport,
  resolveRange,
  type ReportPreset,
} from "@/lib/services";
import { first, formatDate, reportRangeMessage } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Platform reports",
  robots: { index: false, follow: false },
};

const PRESETS: { value: ReportPreset; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Date range" },
];

export default async function PlatformReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const presetParam = first(params.preset) as ReportPreset | undefined;
  const preset: ReportPreset =
    presetParam && ["daily", "weekly", "monthly", "custom"].includes(presetParam)
      ? presetParam
      : "monthly";

  const range = resolveRange(preset, first(params.from), first(params.to));
  const rangeError =
    preset === "custom" ? reportRangeMessage(first(params.from), first(params.to)) : null;
  const churchId = first(params.church);

  const [prayerTypes, churches] = await Promise.all([
    getPrayerTypes(),
    getChurchViews({ limit: 50 }),
  ]);

  let report = null;
  let loadFailed = false;
  if (!rangeError) {
    try {
      report = await getReport({
        from: range.from,
        to: range.to,
        churchId: churchId && churchId !== "ALL" ? churchId : undefined,
        prayerTypeId: first(params.type),
        method: first(params.method),
        paymentStatus: first(params.payment),
        preset,
        platform: true,
      });
    } catch {
      loadFailed = true;
    }
  }

  const selectedChurch = churches.data.find((c) => c.id === churchId);

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
    return qs ? `/super-admin/reports?${qs}` : "/super-admin/reports";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Platform", href: "/super-admin" }, { label: "Reports" }]}
        title="Platform reports"
        description={`${range.label} · ${formatDate(range.from)} to ${formatDate(range.to)} · ${selectedChurch?.name ?? "All churches"}`}
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
              param: "church",
              label: "Church",
              options: churches.data.map((c) => ({ value: c.id, label: c.name })),
            },
            {
              param: "type",
              label: "Prayer type",
              options: prayerTypes.map((t) => ({ value: t.id, label: t.name })),
            },
            { param: "method", label: "Payment method", options: PAYMENT_METHOD_OPTIONS },
            { param: "payment", label: "Payment status", options: PAYMENT_STATUS_OPTIONS },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Platform reports roll up every church by default. Filter by church to see a single
          parish.
        </p>
      </div>

      {loadFailed ? (
        <ReportRetry />
      ) : report ? (
        <ReportView report={report} range={range} showStaff={!!selectedChurch} />
      ) : null}
    </div>
  );
}
