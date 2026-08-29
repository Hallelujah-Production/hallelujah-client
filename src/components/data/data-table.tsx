import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/states";

export interface Column<T> {
  key: string;
  header: string;
  /** Rendered in the desktop table cell. */
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Hidden below lg to keep wide tables usable on laptops. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "right" | "center";
}

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

/**
 * Table for desktop, stacked cards for mobile — one data definition, two
 * presentations, so no list needs a separate mobile component.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  caption,
  rowHref,
  empty,
  mobileCard,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  caption: string;
  rowHref?: (row: T) => string | undefined;
  empty?: { title: string; description?: string; action?: { label: string; href: string } };
  mobileCard?: (row: T) => React.ReactNode;
  className?: string;
}) {
  if (!rows.length) {
    return (
      <EmptyState
        title={empty?.title ?? "Nothing to show yet."}
        description={empty?.description}
        action={empty?.action}
      />
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className={cn("hidden rounded-lg border border-border bg-card shadow-sm lg:block", className)}>
        <div className="overflow-x-auto">
          <table className="w-max min-w-full border-collapse whitespace-nowrap text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.hideBelow && HIDE[column.hideBelow],
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const href = rowHref?.(row);
                return (
                <tr
                  key={row.id}
                  className="group transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 align-middle text-foreground",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.hideBelow && HIDE[column.hideBelow],
                        column.className,
                      )}
                    >
                      {index === 0 && href ? (
                        <Link
                          href={href}
                          className="inline-block rounded font-medium text-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {column.cell(row)}
                        </Link>
                      ) : (
                        column.cell(row)
                      )}
                    </td>
                  ))}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <ul className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            {mobileCard ? (
              mobileCard(row)
            ) : (
              <dl className="space-y-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {column.header}
                    </dt>
                    <dd className="text-right text-sm text-foreground">{column.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
