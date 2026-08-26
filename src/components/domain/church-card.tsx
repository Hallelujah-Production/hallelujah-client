import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { ChurchMark } from "@/components/layout/church-mark";
import { cn } from "@/lib/utils";
import type { Church } from "@/lib/types";

export function ChurchCard({
  church,
  variant = "default",
  className,
}: {
  church: Church;
  variant?: "default" | "compact";
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-[3px]",
          church.accent === "navy" && "bg-primary",
          church.accent === "forest" && "bg-secondary",
          church.accent === "gold" && "bg-accent",
        )}
      />

      <div className="flex items-start gap-4">
        <ChurchMark initials={church.logoInitials} accent={church.accent} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
            <Link href={`/church/${church.slug}`} className="rounded outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring">
              {church.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {church.city}, {church.state}
          </p>
        </div>
      </div>

      {variant === "default" ? (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {church.description}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs font-medium text-muted-foreground">Prayer Services</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors group-hover:text-secondary">
          View Church
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
