"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { completeIntentionAction } from "@/app/actions/intentions";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { notifyResult } from "@/lib/feedback/toast";
import type { IntentionView, StaffDashboardStats } from "@/lib/types";
import { cn, formatLongDate, formatTime, isFuture, isToday } from "@/lib/utils";

function isOpenPrayer(intention: IntentionView): boolean {
  return intention.status !== "COMPLETED" && intention.status !== "CANCELLED";
}

function canComplete(intention: IntentionView): boolean {
  return intention.status === "PENDING_PRAYER" || intention.status === "IN_PROGRESS";
}

function personName(intention: IntentionView): string {
  return intention.requestedBy || intention.customer.name;
}

function whenLabel(intention: IntentionView): string {
  const day = isToday(intention.prayerDate) ? "Today" : formatLongDate(intention.prayerDate);
  const time = intention.preferredTime ? formatTime(intention.preferredTime) : null;
  return time ? `${day} · ${time}` : day;
}

export function StaffPrayerQueue({
  churchName,
  assigned,
  stats,
}: {
  churchName: string;
  assigned: IntentionView[];
  stats?: StaffDashboardStats;
}) {
  const router = useRouter();
  const [notNowIds, setNotNowIds] = React.useState<Set<string>>(() => new Set());
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(() => new Set());
  const [index, setIndex] = React.useState(0);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const skipScrollSync = React.useRef(false);

  const queue = React.useMemo(
    () =>
      assigned.filter(
        (row) => isOpenPrayer(row) && !notNowIds.has(row.id) && !completedIds.has(row.id),
      ),
    [assigned, notNowIds, completedIds],
  );
  const queueKey = queue.map((row) => row.id).join("|");

  const focused = queue[index] ?? null;
  const upNext = queue.filter((_, i) => i !== index);
  const hasDueToday = queue.some((row) => !isFuture(row.prayerDate));
  const todayRemaining = queue.filter((row) => !isFuture(row.prayerDate)).length;
  const awaitingSync = assigned.filter((row) => completedIds.has(row.id) && isOpenPrayer(row)).length;
  const completedCount = (stats?.completed ?? 0) + awaitingSync;

  const scrollTo = React.useCallback((nextIndex: number, behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelectorAll<HTMLElement>("[data-queue-card]")[nextIndex];
    if (!card) return;
    skipScrollSync.current = true;
    scroller.scrollTo({ left: card.offsetLeft, behavior });
    window.setTimeout(() => {
      skipScrollSync.current = false;
    }, behavior === "smooth" ? 320 : 0);
  }, []);

  React.useLayoutEffect(() => {
    const safe = Math.min(index, Math.max(0, queue.length - 1));
    if (safe !== index) setIndex(safe);
    scrollTo(safe, "auto");
    // Queue identity only — swipe must not trigger a programmatic scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueKey, scrollTo]);

  const onScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || skipScrollSync.current || !queue.length) return;
    const left = scroller.scrollLeft;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    scroller.querySelectorAll<HTMLElement>("[data-queue-card]").forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - left);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (best !== index) setIndex(best);
  };

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(queue.length - 1, next));
    setIndex(clamped);
    scrollTo(clamped);
  };

  const completeFocused = () => {
    if (!focused || !canComplete(focused) || pendingId) return;
    const intention = focused;
    setPendingId(intention.id);
    void (async () => {
      const result = await completeIntentionAction(intention.id);
      if (result.status !== "success") {
        setPendingId(null);
        notifyResult(result, {
          successTitle: "Prayer completed",
          errorTitle: "Unable to complete this prayer",
        });
        return;
      }
      setCompletedIds((ids) => {
        const next = new Set(ids);
        next.add(intention.id);
        return next;
      });
      setPendingId(null);
      router.refresh();
    })();
  };

  const notNowFocused = () => {
    if (!focused || pendingId) return;
    const moved = focused;
    setNotNowIds((ids) => {
      const next = new Set(ids);
      next.add(moved.id);
      return next;
    });
  };

  if (!queue.length) {
    return (
      <div className="space-y-4">
        <QueueChrome churchName={churchName} today={todayRemaining} completed={completedCount} remaining={0} />
        <EmptyState
          title="No prayers for today"
          description={
            stats?.upcoming
              ? `You have ${stats.upcoming} upcoming ${stats.upcoming === 1 ? "prayer" : "prayers"} assigned. They will appear here on their scheduled day.`
              : "When the parish office allots an intention to you, it will appear here."
          }
          action={
            stats?.upcoming
              ? { label: "View upcoming prayers", href: "/upcoming" }
              : { label: "My Prayers", href: "/my-prayers" }
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <QueueChrome
        churchName={churchName}
        today={todayRemaining}
        completed={completedCount}
        remaining={queue.length}
      />

      {!hasDueToday ? (
        <p className="text-center text-sm text-muted-foreground">
          No prayers for today. Next scheduled prayer is shown below.
        </p>
      ) : null}

      <div className="mx-auto w-full max-w-md sm:max-w-lg">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {queue.map((intention, i) => (
            <CurrentPrayerCard
              key={intention.id}
              intention={intention}
              index={i}
              isFocused={i === index}
              pending={pendingId === intention.id}
              onNotNow={notNowFocused}
              onComplete={completeFocused}
            />
          ))}
        </div>

        <div className="mt-2.5 flex flex-col items-center gap-1">
          {queue.length > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5" role="tablist" aria-label="Prayer queue">
              {queue.map((intention, i) => (
                <button
                  key={intention.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Prayer ${i + 1} of ${queue.length}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index ? "w-5 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40",
                  )}
                />
              ))}
            </div>
          ) : null}
          {queue.length > 1 ? <p className="text-xs text-muted-foreground">Swipe to view</p> : null}
        </div>
      </div>

      {upNext.length ? (
        <section className="rounded-lg border border-border bg-muted/30 px-3 py-3 sm:px-4 sm:py-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Up Next
              <span className="ml-2 font-medium tabular-nums normal-case tracking-normal text-foreground">
                {upNext.length}
              </span>
            </h2>
            <Link href="/upcoming" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
              View all
            </Link>
          </div>
          <div className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-0.5 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {upNext.map((intention) => {
              const queueIndex = queue.findIndex((row) => row.id === intention.id);
              return (
                <button
                  key={intention.id}
                  type="button"
                  onClick={() => goTo(queueIndex)}
                  className="flex w-[11.5rem] shrink-0 snap-start flex-col rounded-md border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 sm:w-[13.5rem] md:w-[14.5rem]"
                >
                  <div className="flex items-center gap-2">
                    <PrayerIcon icon={intention.prayerType.icon} index={queueIndex} size="sm" />
                    <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {intention.prayerType.name}
                    </p>
                  </div>
                  <p className="mt-2 truncate font-display text-base font-semibold text-foreground">
                    {personName(intention)}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">For: {intention.prayerFor}</p>
                  <p className="mt-auto pt-2 text-xs tabular-nums text-muted-foreground">{whenLabel(intention)}</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function QueueChrome({
  churchName,
  today,
  completed,
  remaining,
}: {
  churchName: string;
  today: number;
  completed: number;
  remaining: number;
}) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Prayer Queue
        </p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{churchName}</p>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-end sm:text-sm">
        <span>
          Today <strong className="font-semibold tabular-nums text-foreground">{today}</strong>
        </span>
        <span className="text-border" aria-hidden="true">
          ·
        </span>
        <span>
          Completed <strong className="font-semibold tabular-nums text-foreground">{completed}</strong>
        </span>
        <span className="text-border" aria-hidden="true">
          ·
        </span>
        <span>
          Remaining <strong className="font-semibold tabular-nums text-foreground">{remaining}</strong>
        </span>
      </p>
    </header>
  );
}

function CurrentPrayerCard({
  intention,
  index,
  isFocused,
  pending,
  onNotNow,
  onComplete,
}: {
  intention: IntentionView;
  index: number;
  isFocused: boolean;
  pending: boolean;
  onNotNow: () => void;
  onComplete: () => void;
}) {
  const completeEnabled = canComplete(intention);
  const details = intention.message?.trim();

  return (
    <article
      data-queue-card
      className={cn(
        "flex w-full min-w-full shrink-0 snap-start flex-col rounded-lg border bg-card px-5 py-5 shadow-sm sm:px-6 sm:py-6",
        isFocused ? "border-primary/35" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <PrayerIcon icon={intention.prayerType.icon} index={index} size="sm" />
        <h2 className="min-w-0 font-display text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
          {intention.prayerType.name}
        </h2>
      </div>

      <p className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-[2.35rem]">
        {personName(intention)}
      </p>
      <p className="mt-2 text-base text-muted-foreground sm:text-lg">
        Pray for <span className="font-medium text-foreground">{intention.prayerFor}</span>
      </p>

      <p className="mt-4 text-sm text-muted-foreground">{whenLabel(intention)}</p>

      {details ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80">{details}</p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 text-sm sm:h-14 sm:text-base"
          onClick={onNotNow}
          disabled={!isFocused || pending}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Not Now
        </Button>
        <Button
          type="button"
          variant="success"
          className="h-12 text-sm font-semibold sm:h-14 sm:text-base"
          onClick={onComplete}
          disabled={!isFocused || !completeEnabled || pending}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {pending ? "Saving…" : "Complete"}
        </Button>
      </div>
      {!completeEnabled ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Scheduled for later. Complete is available on the prayer day.
        </p>
      ) : null}
    </article>
  );
}
