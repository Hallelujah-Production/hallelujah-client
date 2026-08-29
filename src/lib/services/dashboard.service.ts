import "server-only";

import { apiGet } from "@/lib/api/client";
import { mapChurch } from "@/lib/api/adapters";
import { paiseToRupees } from "@/lib/api/money";
import type {
  ChurchDashboardStats,
  PlatformDashboardStats,
  StaffDashboardStats,
  TrendPoint,
} from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/types";
import { dayLabel } from "@/lib/utils";
import { getUsers } from "./user.service";

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
  const bundle = await apiGet<{
    today: ReportSummary;
    month: ReportSummary;
    daily: { data: DailyRow[] };
    prayerTypes: { data: PrayerTypeRow[] };
    parishes?: Record<string, unknown>[];
  }>("/reports/dashboard");
  const today = bundle.today;
  const month = bundle.month;
  const daily = { data: bundle.daily?.data ?? [] };
  const types = { data: bundle.prayerTypes?.data ?? [] };

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
    parishes: (bundle.parishes ?? []).map((row) => mapChurch(row)),
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

/** Cheap counts for settings / empty-install dashboard. One users list carries role + church totals. */
export async function getPlatformHeadcounts(): Promise<{
  totalChurches: number;
  activeChurches: number;
  totalUsers: number;
  superAdmins: number;
}> {
  const users = await getUsers({ limit: 1 });
  return {
    totalChurches: users.churchTotals?.total ?? 0,
    activeChurches: users.churchTotals?.active ?? 0,
    totalUsers: users.roleTotals?.total ?? users.total,
    superAdmins: users.roleTotals?.superAdmins ?? 0,
  };
}

export async function getPlatformStats(): Promise<PlatformDashboardStats> {
  const dashboard = await apiGet<{
    today: ReportSummary;
    month: ReportSummary;
    daily: { data: DailyRow[] };
    churches: { data: ChurchBreakdown[] };
    headcounts: {
      churches: number;
      activeChurches: number;
      users: number;
      admins: number;
      staff: number;
    };
  }>("/admin/reports/dashboard");

  const today = dashboard.today;
  const month = dashboard.month;
  const daily = { data: dashboard.daily?.data ?? [] };
  const churchRows = { data: dashboard.churches?.data ?? [] };
  const counts = dashboard.headcounts ?? {
    churches: 0,
    activeChurches: 0,
    users: 0,
    admins: 0,
    staff: 0,
  };

  if (counts.churches === 0) {
    return emptyPlatformStats({ totalUsers: counts.users });
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
    totalChurches: counts.churches,
    activeChurches: counts.activeChurches,
    totalUsers: counts.users,
    totalAdmins: counts.admins,
    totalStaff: counts.staff,
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
  const bundle = await apiGet<{
    today: number;
    upcoming: number;
    completed: number;
    all: number;
  }>("/my-prayers/stats");
  return {
    today: bundle.today,
    pending: Math.max(0, bundle.all - bundle.completed),
    completed: bundle.completed,
    upcoming: bundle.upcoming,
  };
}
