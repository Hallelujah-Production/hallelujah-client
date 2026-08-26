import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "secondary" | "accent" | "warning" | "success" | "danger";

const TONE_RING: Record<Tone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-muted text-primary",
  secondary: "bg-secondary-muted text-secondary",
  accent: "bg-accent-muted text-accent",
  warning: "bg-warning-muted text-warning",
  success: "bg-success-muted text-success",
  danger: "bg-destructive-muted text-destructive",
};

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  href?: string;
  emphasis?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  href,
  emphasis,
  className,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              TONE_RING[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-3 font-display font-semibold tracking-tight text-foreground tabular-nums",
          emphasis ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  const base = cn(
    "rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow",
    href && "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(base, "block")}>
        {content}
      </Link>
    );
  }
  return <div className={base}>{content}</div>;
}

export function StatGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 xl:grid-cols-4",
        columns === 5 && "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card shadow-sm", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="space-y-0.5">
          <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="min-w-0 overflow-x-auto px-5 py-5">{children}</div>
    </section>
  );
}
