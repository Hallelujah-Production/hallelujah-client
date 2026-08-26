"use client";

import { useEffect, useState } from "react";
import type { IntentionStatus } from "@/lib/types";
import { cn, formatPrayerClock, formatPrayerDuration, prayerElapsedSeconds } from "@/lib/utils";

export function PrayerElapsedTimer({
  startedAt,
  className,
}: {
  startedAt: string;
  className?: string;
}) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setSeconds(prayerElapsedSeconds(startedAt) ?? 0);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return (
    <time
      dateTime={seconds == null ? undefined : `PT${seconds}S`}
      className={cn("inline-block min-w-[5ch] tabular-nums", className)}
    >
      {seconds == null ? "\u00a0" : formatPrayerClock(seconds)}
    </time>
  );
}

/** Live clock while offering; final duration after complete. */
export function PrayerDurationText({
  status,
  startedAt,
  completedAt,
  className,
}: {
  status: IntentionStatus;
  startedAt?: string;
  completedAt?: string;
  className?: string;
}) {
  if (status === "IN_PROGRESS" && startedAt) {
    return <PrayerElapsedTimer startedAt={startedAt} className={className} />;
  }
  if (status === "COMPLETED") {
    return <span className={className}>{formatPrayerDuration(startedAt, completedAt)}</span>;
  }
  return null;
}
