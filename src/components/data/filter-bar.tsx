"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn, reportRangeMessage } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  param: string;
  label: string;
  options: FilterOption[];
  /** Value that means "no filter"; removed from the URL. */
  allValue?: string;
}

/**
 * Filters live in the query string alongside search and pagination, so any
 * combination of them is a shareable URL and the server does the filtering.
 * Tenant identity is deliberately absent — it comes from the session.
 */
export function FilterBar({
  filters,
  dateRange,
  className,
}: {
  filters: FilterDefinition[];
  dateRange?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const setParam = (param: string, value: string, allValue = "ALL") => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === allValue) params.delete(param);
    else params.set(param, value);
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const rangeError = dateRange ? reportRangeMessage(from, to) : null;

  const activeCount =
    filters.filter((f) => searchParams.get(f.param)).length +
    (from ? 1 : 0) +
    (to ? 1 : 0);

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    filters.forEach((f) => params.delete(f.param));
    params.delete("from");
    params.delete("to");
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-end gap-3">
      {filters.map((filter) => {
        const allValue = filter.allValue ?? "ALL";
        const current = searchParams.get(filter.param) ?? allValue;
        return (
          <div key={filter.param} className="min-w-[9rem] flex-1 sm:flex-none">
            <label
              htmlFor={`filter-${filter.param}`}
              className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
            >
              {filter.label}
            </label>
            <select
              id={`filter-${filter.param}`}
              value={current}
              onChange={(event) => setParam(filter.param, event.target.value, allValue)}
              className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              suppressHydrationWarning
            >
              <option value={allValue}>All</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      {dateRange ? (
        <>
          <div className="min-w-[9rem] flex-1 sm:flex-none">
            <label
              htmlFor="filter-from"
              className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
            >
              From
            </label>
            <input
              id="filter-from"
              type="date"
              value={from}
              onChange={(event) => setParam("from", event.target.value, "")}
              aria-invalid={rangeError ? true : undefined}
              aria-describedby={rangeError ? "filter-range-error" : undefined}
              className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              suppressHydrationWarning
            />
          </div>
          <div className="min-w-[9rem] flex-1 sm:flex-none">
            <label
              htmlFor="filter-to"
              className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
            >
              To
            </label>
            <input
              id="filter-to"
              type="date"
              value={to}
              onChange={(event) => setParam("to", event.target.value, "")}
              aria-invalid={rangeError ? true : undefined}
              aria-describedby={rangeError ? "filter-range-error" : undefined}
              className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              suppressHydrationWarning
            />
          </div>
        </>
      ) : null}

      {activeCount > 0 ? (
        <button
          type="button"
          onClick={clearAll}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          suppressHydrationWarning
        >
          Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
        </button>
      ) : null}
      </div>
      {rangeError ? (
        <p id="filter-range-error" role="alert" className="text-xs font-medium text-destructive">
          {rangeError}
        </p>
      ) : null}
    </div>
  );
}
