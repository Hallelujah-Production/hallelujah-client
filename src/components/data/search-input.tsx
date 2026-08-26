"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * URL-driven, debounced search.
 *
 * Keeping the query in the URL means the server component re-renders with the
 * new filter, the result is shareable and the browser Back button behaves — no
 * client-side result cache to keep in sync.
 */
export function SearchInput({
  placeholder = "Search…",
  paramName = "search",
  label = "Search",
  className,
  autoFocus,
}: {
  placeholder?: string;
  paramName?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get(paramName) ?? "";

  const [value, setValue] = React.useState(initial);
  const [isPending, startTransition] = React.useTransition();
  const inputId = React.useId();

  // Keep the field in step when navigation changes the query from elsewhere.
  React.useEffect(() => {
    setValue(searchParams.get(paramName) ?? "");
  }, [searchParams, paramName]);

  const commit = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set(paramName, next.trim());
      else params.delete(paramName);
      params.delete("page"); // a new query always starts at page one
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, paramName, router, searchParams],
  );

  React.useEffect(() => {
    if (value === (searchParams.get(paramName) ?? "")) return;
    const timer = setTimeout(() => commit(value), 350);
    return () => clearTimeout(timer);
  }, [value, commit, searchParams, paramName]);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13.5 13.5L17 17" strokeLinecap="round" />
      </svg>
      <input
        id={inputId}
        type="search"
        inputMode="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(value);
          }
          if (event.key === "Escape") {
            setValue("");
            commit("");
          }
        }}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 [&::-webkit-search-cancel-button]:hidden"
        suppressHydrationWarning
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            commit("");
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          suppressHydrationWarning
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
      <span aria-live="polite" className="sr-only">
        {isPending ? "Updating results" : ""}
      </span>
    </div>
  );
}
