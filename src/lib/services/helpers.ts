import "server-only";

import type { Paginated } from "@/lib/types";

/**
 * Pagination is applied here the way the future API will apply it: the caller
 * asks for a page and receives only that page plus the totals. Components
 * never receive the full collection, so swapping in a server-paginated
 * endpoint changes nothing above this layer.
 */
export function paginate<T>(rows: T[], page = 1, limit = 20): Paginated<T> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * safeLimit;

  return {
    data: rows.slice(start, start + safeLimit),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
  };
}

export function matchesSearch(needle: string | undefined, ...haystack: (string | undefined)[]) {
  if (!needle) return true;
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((value) => value?.toLowerCase().includes(q));
}

export function withinRange(value: string, from?: string, to?: string) {
  const date = value.slice(0, 10);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function byDateDesc<T extends { createdAt: string }>(a: T, b: T) {
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function sum(values: number[]) {
  return values.reduce((acc, v) => acc + v, 0);
}

/** Deep-clones service results so callers can never mutate the mock store. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Raw invitation tokens are development-only. Production never forwards them
 * to the browser — the emailed `/set-password?token=…` link is the only URL.
 */
export function developmentInviteToken(token?: string): string | undefined {
  if (process.env.NODE_ENV === "production" || !token) return undefined;
  return token;
}

export function developmentSetPasswordNote(
  token?: string,
  lead = "Set-password link (development only)",
): string {
  const value = developmentInviteToken(token);
  return value ? ` ${lead}: /set-password?token=${value}` : "";
}
