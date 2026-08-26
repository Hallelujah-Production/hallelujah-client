import "server-only";

import { apiGet, apiGetPaginated } from "@/lib/api/client";
import { paiseToRupees } from "@/lib/api/money";
import type {
  ChurchDashboardStats,
  PlatformDashboardStats,
  StaffDashboardStats,
  TrendPoint,
} from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/types";
import { dayLabel } from "@/lib/utils";

interface ReportSummary {
  intentions: {
    total: number;
    created: number;
    paymentPending: number;
    paid: number;
    assigned: number;
    pendingPrayer: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  completedInRange: number;
  pendingPrayers: number;
  pendingVerification: number;
  payments: {
    total: number;
    pendingVerification: number;
    rejected: number;
    verified: number;
    collected: { count: number; totalPaise: number };
    cash: { count: number; totalPaise: number };
    upi: { count: number; totalPaise: number };
  };
  receipts: { issued: number; totalPaise: number };
}

interface DailyRow {
  date: string;
  intentions: number;
  completed: number;
  collectedPaise: number;
}

interface PrayerTypeRow {
  name: string;
  intentionCount: number;
}

interface ChurchBreakdown {
  name: string;
  slug: string;
  intentions: number;
  completed: number;
  collectedPaise: number;
}

export async function getDashboardStats(_churchId: string): Promise<ChurchDashboardStats> {
  const [today, month, daily, types] = await Promise.all([
    apiGet<ReportSummary>("/reports/summary", { query: { period: "today" } }),
    apiGet<ReportSummary>("/reports/summary", { query: { period: "this_month" } }),
    apiGetPaginated<DailyRow>("/reports/daily", { query: { period: "this_month", limit: 100 } }),
    apiGetPaginated<PrayerTypeRow>("/reports/prayer-types", {
      query: { period: "this_month", limit: 100 },
    }),
  ]);

  const series = daily.data.slice(-14);
  const revenueTrend: TrendPoint[] = series.map((row) => ({
    label: dayLabel(row.date),
    value: paiseToRupees(row.collectedPaise),
  }));
  const intentionTrend: TrendPoint[] = series.map((row) => ({
    label: dayLabel(row.date),
    value: row.intentions,
    secondary: row.completed,
  }));
  const prayerTypeSplit: TrendPoint[] = types.data
    .map((row) => ({ label: row.name.replace(" Prayer", ""), value: row.intentionCount }))
    .filter((p) => p.value > 0)
    .slice(0, 6);
  const paymentMethodSplit: TrendPoint[] = [
    { label: PAYMENT_METHOD_LABEL.CASH, value: month.payments.cash.count },
    { label: PAYMENT_METHOD_LABEL.UPI, value: month.payments.upi.count },
  ].filter((p) => p.value > 0);

  const pending =
    today.intentions.created +
    today.intentions.paymentPending +
    today.intentions.paid +
    today.intentions.assigned +
    today.intentions.pendingPrayer;

  return {
    todaysIntentions: today.intentions.total - today.intentions.cancelled,
    pending,
    inProgress: today.intentions.inProgress,
    completed: today.intentions.completed,
    todaysCollection: paiseToRupees(today.payments.collected.totalPaise),
    paymentsPendingVerification: today.pendingVerification,
    upcomingPrayers: today.intentions.assigned,
    monthRevenue: paiseToRupees(month.payments.collected.totalPaise),
    revenueTrend,
    intentionTrend,
    prayerTypeSplit,
    paymentMethodSplit,
  };
}

function emptyPlatformStats(
  overrides: Partial<PlatformDashboardStats> = {},
): PlatformDashboardStats {
  return {
    totalChurches: 0,
    activeChurches: 0,
    totalUsers: 0,
    totalAdmins: 0,
    totalStaff: 0,
    totalIntentions: 0,
    pending: 0,
    completed: 0,
    totalRevenue: 0,
    todaysRevenue: 0,
    revenueTrend: [],
    intentionTrend: [],
    churchPerformance: [],
    paymentMethodSplit: [],
    completionSplit: [],
    ...overrides,
  };
}

/** Cheap counts for settings / empty-install dashboard. Avoids 9 report RTTs. */
export async function getPlatformHeadcounts(): Promise<{
  totalChurches: number;
  activeChurches: number;
  totalUsers: number;
  superAdmins: number;
}> {
  const [churches, active, users, supers] = await Promise.all([
    apiGetPaginated<Record<string, unknown>>("/admin/churches", {
      query: { limit: 1, countsOnly: true },
    }),
    apiGetPaginated<Record<string, unknown>>("/admin/churches", {
      query: { status: "ACTIVE", limit: 1, countsOnly: true },
    }),
    apiGetPaginated<Record<string, unknown>>("/admin/users", {
      query: { limit: 1, countsOnly: true },
    }),
    apiGetPaginated<Record<string, unknown>>("/admin/users", {
      query: { role: "SUPER_ADMIN", limit: 1, countsOnly: true },
    }),
  ]);
  return {
    totalChurches: churches.total,
    activeChurches: active.total,
    totalUsers: users.total,
    superAdmins: supers.total,
  };
}

export async function getPlatformStats(): Promise<PlatformDashboardStats> {
  const [churches, users, today, month, daily, churchRows, admins, staff, active] =
    await Promise.all([
      apiGetPaginated<Record<string, unknown>>("/admin/churches", {
        query: { limit: 1, countsOnly: true },
      }),
      apiGetPaginated<Record<string, unknown>>("/admin/users", {
        query: { limit: 1, countsOnly: true },
      }),
      apiGet<ReportSummary>("/admin/reports/summary", { query: { period: "today" } }),
      apiGet<ReportSummary>("/admin/reports/summary", { query: { period: "this_month" } }),
      apiGetPaginated<DailyRow>("/admin/reports/daily", {
        query: { period: "this_month", limit: 100 },
      }),
      apiGetPaginated<ChurchBreakdown>("/admin/reports/churches", {
        query: { period: "this_month", limit: 100 },
      }),
      apiGetPaginated<Record<string, unknown>>("/admin/users", {
        query: { role: "CHURCH_ADMIN", limit: 1, countsOnly: true },
      }),
      apiGetPaginated<Record<string, unknown>>("/admin/users", {
        query: { role: "CHURCH_STAFF", limit: 1, countsOnly: true },
      }),
      apiGetPaginated<Record<string, unknown>>("/admin/churches", {
        query: { status: "ACTIVE", limit: 1, countsOnly: true },
      }),
    ]);

  if (churches.total === 0) {
    return emptyPlatformStats({ totalUsers: users.total });
  }

  const series = daily.data.slice(-14);
  const revenueTrend: TrendPoint[] = series.map((row) => ({
    label: dayLabel(row.date),
    value: paiseToRupees(row.collectedPaise),
  }));
  const intentionTrend: TrendPoint[] = series.map((row) => ({
    label: dayLabel(row.date),
    value: row.intentions,
    secondary: row.completed,
  }));
  const churchPerformance: TrendPoint[] = churchRows.data
    .map((row) => ({
      label: row.name.replace(/\s(Church|Shrine)$/, ""),
      value: paiseToRupees(row.collectedPaise),
      secondary: row.intentions,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    totalChurches: churches.total,
    activeChurches: active.total,
    totalUsers: users.total,
    totalAdmins: admins.total,
    totalStaff: staff.total,
    totalIntentions: month.intentions.total,
    pending: month.intentions.total - month.intentions.completed - month.intentions.cancelled,
    completed: month.intentions.completed,
    totalRevenue: paiseToRupees(month.payments.collected.totalPaise),
    todaysRevenue: paiseToRupees(today.payments.collected.totalPaise),
    revenueTrend,
    intentionTrend,
    churchPerformance,
    paymentMethodSplit: [
      { label: PAYMENT_METHOD_LABEL.CASH, value: month.payments.cash.count },
      { label: PAYMENT_METHOD_LABEL.UPI, value: month.payments.upi.count },
    ].filter((p) => p.value > 0),
    completionSplit: [
      { label: "Completed", value: month.intentions.completed },
      {
        label: "In workflow",
        value: month.intentions.total - month.intentions.completed - month.intentions.cancelled,
      },
      { label: "Cancelled", value: month.intentions.cancelled },
    ],
  };
}

export async function getPublicDirectoryStats(): Promise<{
  activeChurches: number;
  totalIntentions: number;
  completed: number;
}> {
  try {
    const churches = await apiGet<unknown[]>("/public/churches", { revalidate: 60 });
    return {
      activeChurches: Array.isArray(churches) ? churches.length : 0,
      totalIntentions: 0,
      completed: 0,
    };
  } catch {
    return { activeChurches: 0, totalIntentions: 0, completed: 0 };
  }
}

export async function getStaffStats(
  _churchId: string,
  _staffUserId: string,
): Promise<StaffDashboardStats> {
  const [today, upcoming, completed, all] = await Promise.all([
    apiGetPaginated<unknown>("/my-prayers", { query: { scope: "today", limit: 1 } }),
    apiGetPaginated<unknown>("/my-prayers", { query: { scope: "upcoming", limit: 1 } }),
    apiGetPaginated<unknown>("/my-prayers", { query: { scope: "completed", limit: 1 } }),
    apiGetPaginated<unknown>("/my-prayers", { query: { scope: "all", limit: 1 } }),
  ]);
  return {
    today: today.total,
    pending: Math.max(0, all.total - completed.total),
    completed: completed.total,
    upcoming: upcoming.total,
  };
}
