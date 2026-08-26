import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Link-based pagination. Because every page is a real URL the server renders
 * only the requested slice — no list ever ships thousands of rows to the client.
 */
export function Pagination({
  page,
  totalPages,
  total,
  limit,
  basePath,
  searchParams,
  itemLabel = "records",
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  itemLabel?: string;
}) {
  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      const v = Array.isArray(value) ? value[0] : value;
      if (v) params.set(key, v);
    }
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  const pages: (number | "gap")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{first}</span>–
        <span className="font-medium text-foreground">{last}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> {itemLabel}
      </p>

      {totalPages > 1 ? (
        <ul className="flex items-center gap-1">
          <li>
            <PageLink href={hrefFor(page - 1)} disabled={page <= 1} label="Previous page">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </PageLink>
          </li>
          {pages.map((entry, index) =>
            entry === "gap" ? (
              <li key={`gap-${index}`} className="px-1.5 text-sm text-muted-foreground" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={entry}>
                <Link
                  href={hrefFor(entry)}
                  aria-current={entry === page ? "page" : undefined}
                  className={cn(
                    "flex h-9 min-w-9 items-center justify-center rounded-md border px-2.5 text-sm font-medium transition-colors",
                    entry === page
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {entry}
                </Link>
              </li>
            ),
          )}
          <li>
            <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} label="Next page">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </PageLink>
          </li>
        </ul>
      ) : null}
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground/50"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      rel={label === "Next page" ? "next" : "prev"}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-card text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}
