import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currency.format(value ?? 0);
}

export function formatCompactCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

/**
 * Dates are formatted with an explicit UTC time zone so the server-rendered
 * markup and the client hydration always agree, regardless of the viewer's
 * local zone. Mock timestamps are all authored in UTC.
 */
export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: iso.length === 10 ? "UTC" : PARISH_TIMEZONE,
  }).format(d);
}

export function formatLongDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: iso.length === 10 ? "UTC" : PARISH_TIMEZONE,
  }).format(d);
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: PARISH_TIMEZONE,
  }).format(d);
}

export function prayerElapsedSeconds(startedAt?: string, endedAt?: string): number | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return null;
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.floor((end - start) / 1000));
}

export function formatPrayerClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Human duration for admin / staff / Super Admin lists. */
export function formatPrayerDuration(startedAt?: string, completedAt?: string): string {
  const sec = prayerElapsedSeconds(startedAt, completedAt);
  if (sec == null) return "Not timed";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h} hr ${m} min ${s} sec`;
  if (m) return `${m} min ${s} sec`;
  return `${s} sec`;
}

export function formatTime(hhmm?: string): string {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function relativeTime(iso: string, now = new Date().toISOString()): string {
  const then = new Date(iso).getTime();
  const diff = new Date(now).getTime() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export const PARISH_TIMEZONE = "Asia/Kolkata";

export function todayInParish(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PARISH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export const TODAY = todayInParish();

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export const MAX_REPORT_DAYS = 366;

export function reportRangeMessage(from?: string | null, to?: string | null): string | null {
  if (!from || !to) return null;
  if (from > to) return "The start date must be on or before the end date.";
  if (daysBetween(from, to) + 1 > MAX_REPORT_DAYS) {
    return `Choose a range of ${MAX_REPORT_DAYS} days or fewer.`;
  }
  return null;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a.slice(0, 10)}T00:00:00Z`).getTime();
  const db = new Date(`${b.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86400000);
}

export function isToday(iso?: string): boolean {
  return !!iso && iso.slice(0, 10) === TODAY;
}

export function isFuture(iso?: string): boolean {
  return !!iso && iso.slice(0, 10) > TODAY;
}

export function isPast(iso?: string): boolean {
  return !!iso && iso.slice(0, 10) < TODAY;
}

export function monthLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

export function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Canonical public slug. "St. Mary's Church" → `st-marys`, never
 * `st-marys-church` — public URLs are `/church/st-marys`.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/\b(church|shrine|cathedral|parish)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-(church|shrine|cathedral|parish)$/g, "");
}

export function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function truncate(input: string, max = 90): string {
  return input.length > max ? `${input.slice(0, max - 1)}…` : input;
}

/** Masks a mobile number for list views: 98765 43210 -> 98765 4••••. */
export function maskMobile(mobile: string): string {
  if (mobile.length < 6) return mobile;
  return `${mobile.slice(0, -4)}••••`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Deterministic pseudo-random generator so seeded mock data never shifts. */
export function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Builds a query string, dropping empty/ALL values so URLs stay clean. */
export function buildQuery(
  base: Record<string, string | number | undefined | null>,
  patch: Record<string, string | number | undefined | null> = {},
): string {
  const merged = { ...base, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null) continue;
    const str = String(value);
    if (!str || str === "ALL") continue;
    params.set(key, str);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function readNumberParam(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Narrows a raw query-string value to a known union member. */
export function readEnumParam<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const v = Array.isArray(value) ? value[0] : value;
  return allowed.includes(v as T) ? (v as T) : fallback;
}

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
