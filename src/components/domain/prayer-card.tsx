import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, User } from "lucide-react";
import { PrayerElapsedTimer } from "@/components/domain/prayer-elapsed-timer";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import type { IntentionView } from "@/lib/types";
import { cn, formatLongDate, formatPrayerDuration, formatTime, isToday } from "@/lib/utils";

function staffWorkLabel(status: IntentionView["status"]): string {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "CANCELLED") return "Cancelled";
  return "To offer";
}

/**
 * Large, legible prayer card for the staff views. Staff often read this on a
 * phone while walking through the church, so the hit target is the whole card
 * and the essential facts sit above the fold. Payment is office work — not here.
 */
export function PrayerCard({
  intention,
  href,
  index = 0,
  className,
}: {
  intention: IntentionView;
  href: string;
  index?: number;
  className?: string;
}) {
  const today = isToday(intention.prayerDate);
  const place = [intention.customer.addressLine, intention.customer.city, intention.church?.state]
    .filter((part): part is string => Boolean(part && part.trim()))
    .filter((part, i, all) => all.indexOf(part) === i)
    .join(", ");

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-md border bg-card p-4 shadow-sm transition-colors hover:border-primary/30",
        today ? "border-primary/30" : "border-border",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <PrayerIcon icon={intention.prayerType.icon} index={index} />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{intention.prayerType.name}</p>
            <h3 className="mt-0.5 font-display text-base font-semibold leading-snug tracking-tight text-foreground">
              <Link href={href} className="rounded outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring">
                {intention.prayerFor}
              </Link>
            </h3>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium text-primary">
          {staffWorkLabel(intention.status)}
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">Asked by</dt>
          <dd className="text-foreground">{intention.requestedBy || intention.customer.name}</dd>
        </div>
        {place ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Place</dt>
            <dd className="line-clamp-2 text-muted-foreground">{place}</dd>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">Prayer date</dt>
          <dd className={cn("font-medium", today ? "text-primary" : "text-foreground")}>
            {formatLongDate(intention.prayerDate)}
            {today ? <span className="ml-1.5 text-xs font-semibold text-primary">Today</span> : null}
          </dd>
        </div>
        {intention.preferredTime ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Preferred time</dt>
            <dd className="text-muted-foreground">{formatTime(intention.preferredTime)}</dd>
          </div>
        ) : null}
      </dl>

      {intention.message ? (
        <p className="mt-3 line-clamp-2 rounded border border-dashed border-border bg-muted/40 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
          {intention.message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs tabular-nums text-muted-foreground">{intention.reference}</span>
        {intention.status === "IN_PROGRESS" && intention.startedAt ? (
          <span className="font-display text-sm font-semibold tabular-nums text-primary">
            <PrayerElapsedTimer startedAt={intention.startedAt} />
          </span>
        ) : intention.status === "COMPLETED" ? (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            Offered {formatPrayerDuration(intention.startedAt, intention.completedAt)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Open
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </article>
  );
}
