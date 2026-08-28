import "server-only";

import { apiGet, apiGetPaginated } from "@/lib/api/client";
import { paiseToRupees } from "@/lib/api/money";
import type { StaffPerformanceRow, TrendPoint, User } from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/types";
import { addDays, dayLabel, TODAY } from "@/lib/utils";

export type ReportPreset = "daily" | "weekly" | "monthly" | "custom";

export interface ReportRange {
  from: string;
  to: string;
  label: string;
}

const PERIOD: Record<ReportPreset, string> = {
  daily: "today",
  weekly: "this_week",
  monthly: "this_month",
  custom: "custom",
};

export function resolveRange(preset: ReportPreset, from?: string, to?: string): ReportRange {
  switch (preset) {
    case "daily":
      return { from: TODAY, to: TODAY, label: "Today" };
    case "weekly":
      return { from: addDays(TODAY, -6), to: TODAY, label: "This week" };
    case "monthly":
      return { from: addDays(TODAY, -29), to: TODAY, label: "This month" };
    default:
      return {
        from: from || addDays(TODAY, -29),
        to: to || TODAY,
        label: "Custom range",
      };
  }
}

export interface ReportFilters {
  from: string;
  to: string;
  prayerTypeId?: string;
  method?: string;
  paymentStatus?: string;
  churchId?: string;
  preset?: ReportPreset;
  platform?: boolean;
}

export interface ReportResult {
  summary: {
    intentions: number;
    completed: number;
    cancelled: number;
    revenue: number;
    pendingVerification: number;
    averageOffering: number;
    completionRate: number;
  };
  revenueSeries: TrendPoint[];
  prayerTypeRows: { label: string; count: number; revenue: number }[];
  methodRows: { label: string; count: number; revenue: number }[];
  statusRows: { label: string; count: number }[];
  staffRows: StaffPerformanceRow[];
}

interface SummaryDto {
  range?: { from: string; to: string };
  intentions: {
    total: number;
    completed: number;
    cancelled: number;
    created: number;
    paymentPending: number;
    paid: number;
    assigned: number;
    pendingPrayer: number;
    inProgress: number;
  };
  completedInRange: number;
  pendingVerification: number;
  payments: {
    collected: { count: number; totalPaise: number };
    cash: { count: number; totalPaise: number };
    upi: { count: number; totalPaise: number };
    pendingVerification: number;
  };
}

function periodQuery(filters: ReportFilters) {
  const preset = filters.preset ?? "custom";
  const period = PERIOD[preset];
  return period === "custom"
    ? { period: "custom", from: filters.from, to: filters.to }
    : { period };
}

function prefix(platform: boolean | undefined, churchId?: string) {
  if (platform && churchId) return `/admin/churches/${churchId}/reports`;
  if (platform) return "/admin/reports";
  return "/reports";
}

/** Summary only — skips prayer-types / staff / daily series used by the full reports page. */
export async function getReportSummary(filters: ReportFilters): Promise<SummaryDto> {
  const base = prefix(filters.platform, filters.churchId);
  return apiGet<SummaryDto>(`${base}/summary`, { query: periodQuery(filters) });
}

export async function getReport(filters: ReportFilters): Promise<ReportResult> {
  const base = prefix(filters.platform, filters.churchId);
  const query = periodQuery(filters);

  const [summary, types, staff, daily] = await Promise.all([
    apiGet<SummaryDto>(`${base}/summary`, { query }),
    apiGetPaginated<{ name: string; intentionCount: number; amountPaise: number }>(
      `${base}/prayer-types`,
      { query: { ...query, limit: 100 } },
    ),
    filters.platform && !filters.churchId
      ? Promise.resolve({
          data: [] as {
            staffUserId: string;
            name: string;
            assigned: number;
            completed: number;
            completionRate: number | null;
          }[],
        })
      : apiGetPaginated<{
          staffUserId: string;
          name: string;
          assigned: number;
          completed: number;
          completionRate: number | null;
        }>(`${base}/staff`, { query: { ...query, limit: 100 } }),
    apiGetPaginated<{ date: string; collectedPaise: number; intentions: number }>(
      `${base}/daily`,
      { query: { ...query, limit: 100 } },
    ),
  ]);

  const collected = paiseToRupees(summary.payments.collected.totalPaise);
  const verifiedCount = summary.payments.collected.count || 1;
  const completionRate = summary.intentions.total
    ? Math.round((summary.completedInRange / summary.intentions.total) * 100)
    : 0;

  const staffRows: StaffPerformanceRow[] = staff.data.map((row) => ({
    staff: {
      id: row.staffUserId,
      churchId: filters.churchId ?? null,
      name: row.name,
      email: "",
      phone: "",
      role: "CHURCH_STAFF",
      isActive: true,
      avatarInitials: row.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join(""),
      createdAt: "",
      lastActiveAt: "",
    } satisfies User,
    assigned: row.assigned,
    completed: row.completed,
    completionRate: Math.round(row.completionRate ?? 0),
    revenue: 0,
  }));

  return {
    summary: {
      intentions: summary.intentions.total,
      completed: summary.completedInRange,
      cancelled: summary.intentions.cancelled,
      revenue: collected,
      pendingVerification: summary.pendingVerification,
      averageOffering: summary.payments.collected.count
        ? Math.trunc(collected / verifiedCount)
        : 0,
      completionRate,
    },
    revenueSeries: daily.data.map((row) => ({
      label: dayLabel(row.date),
      value: paiseToRupees(row.collectedPaise),
    })),
    prayerTypeRows: types.data.map((row) => ({
      label: row.name,
      count: row.intentionCount,
      revenue: paiseToRupees(row.amountPaise),
    })),
    methodRows: [
      {
        label: PAYMENT_METHOD_LABEL.CASH,
        count: summary.payments.cash.count,
        revenue: paiseToRupees(summary.payments.cash.totalPaise),
      },
      {
        label: PAYMENT_METHOD_LABEL.UPI,
        count: summary.payments.upi.count,
        revenue: paiseToRupees(summary.payments.upi.totalPaise),
      },
    ].filter((r) => r.count > 0),
    statusRows: [
      { label: "Created", count: summary.intentions.created },
      { label: "Offering recorded", count: summary.intentions.paymentPending },
      { label: "Paid", count: summary.intentions.paid },
      { label: "Assigned", count: summary.intentions.assigned },
      { label: "Pending prayer", count: summary.intentions.pendingPrayer },
      { label: "In progress", count: summary.intentions.inProgress },
      { label: "Completed", count: summary.intentions.completed },
      { label: "Cancelled", count: summary.intentions.cancelled },
    ].filter((r) => r.count > 0),
    staffRows,
  };
}
