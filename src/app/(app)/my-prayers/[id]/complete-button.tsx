"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Play } from "lucide-react";
import { completeIntentionAction, startIntentionAction } from "@/app/actions/intentions";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { notifyResult } from "@/lib/feedback/toast";
import type { IntentionStatus } from "@/lib/types";
import { formatPrayerDuration } from "@/lib/utils";

function staffCanStart(status: IntentionStatus): boolean {
  return (
    status === "CREATED" ||
    status === "PAYMENT_PENDING" ||
    status === "PAID" ||
    status === "ASSIGNED" ||
    status === "PENDING_PRAYER"
  );
}

export function StaffPrayerActions({
  intentionId,
  prayerFor,
  status,
  startedAt,
  compact = false,
}: {
  intentionId: string;
  prayerFor: string;
  status: IntentionStatus;
  startedAt?: string;
  compact?: boolean;
}) {
  const canStart = staffCanStart(status);
  const canComplete = status === "PENDING_PRAYER" || status === "IN_PROGRESS";

  return (
    <div className={compact ? "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center" : "space-y-2"}>
      {canStart ? (
        <PrayerActionButton
          intentionId={intentionId}
          prayerFor={prayerFor}
          startedAt={startedAt}
          mode="start"
          compact={compact}
        />
      ) : null}
      {canComplete ? (
        <PrayerActionButton
          intentionId={intentionId}
          prayerFor={prayerFor}
          startedAt={startedAt}
          mode="complete"
          compact={compact}
        />
      ) : null}
      {!canStart && !canComplete ? (
        <p className="text-sm text-muted-foreground">
          This intention cannot be started or completed in its current state.
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated use StaffPrayerActions */
export function CompletePrayerButton({
  intentionId,
  prayerFor,
}: {
  intentionId: string;
  prayerFor: string;
}) {
  return (
    <PrayerActionButton intentionId={intentionId} prayerFor={prayerFor} mode="complete" />
  );
}

function PrayerActionButton({
  intentionId,
  prayerFor,
  startedAt,
  mode,
  compact = false,
}: {
  intentionId: string;
  prayerFor: string;
  startedAt?: string;
  mode: "start" | "complete";
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [thanks, setThanks] = React.useState<{ duration: string } | null>(null);
  const isStart = mode === "start";

  const confirm = () => {
    startTransition(async () => {
      const result = isStart
        ? await startIntentionAction(intentionId)
        : await completeIntentionAction(intentionId);

      if (result.status !== "success") {
        notifyResult(result, {
          successTitle: isStart ? "Prayer started" : "Prayer completed",
          errorTitle: isStart ? "Unable to start this prayer" : "Unable to complete this prayer",
        });
        setOpen(false);
        return;
      }

      setOpen(false);

      if (isStart) {
        notifyResult(result, {
          successTitle: "Prayer started",
          errorTitle: "Unable to start this prayer",
        });
        router.refresh();
        return;
      }

      const duration = formatPrayerDuration(
        result.startedAt ?? startedAt,
        result.completedAt ?? new Date().toISOString(),
      );
      setThanks({ duration });
      router.refresh();
    });
  };

  return (
    <div className={compact ? "" : "space-y-2"}>
      {thanks ? (
        <PrayerThanksOverlay prayerFor={prayerFor} duration={thanks.duration} />
      ) : (
        <Button
          size={compact ? "sm" : "md"}
          variant={isStart ? (compact ? "accent" : "outline") : "success"}
          className={compact ? "w-full min-w-[8.5rem] sm:w-auto" : "w-full"}
          onClick={() => setOpen(true)}
          disabled={pending}
        >
          {isStart ? (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {pending ? "Saving…" : isStart ? "Start prayer" : "Mark completed"}
        </Button>
      )}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        title={isStart ? "Start this prayer?" : "Mark this prayer as completed?"}
        description={
          isStart
            ? `This starts the offering timer for ${prayerFor}.`
            : `This records that the prayer for ${prayerFor} has been offered, with the time you spent and your name.`
        }
        confirmLabel={isStart ? "Yes, start" : "Yes, it is completed"}
        tone={isStart ? "primary" : "success"}
        pending={pending}
      />
    </div>
  );
}

function PrayerThanksOverlay({
  prayerFor,
  duration,
}: {
  prayerFor: string;
  duration: string;
}) {
  const timed = duration !== "Not timed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-foreground/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-[2px] sm:items-center"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card px-5 py-8 text-center shadow-lg sm:px-6 sm:py-10">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <span
            aria-hidden="true"
            className="success-tick-ring absolute inset-0 rounded-full bg-success/20"
          />
          <span className="success-tick relative flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" aria-hidden="true">
              <path
                d="M6 12.5l4 4 8-9"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent">
          Hallelujah
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
          Thank you for praying
        </h2>
        <p className="mt-3 text-base leading-relaxed text-foreground">
          for <span className="font-semibold">{prayerFor}</span>
        </p>
        {timed ? (
          <p className="mt-4 font-display text-lg font-semibold tabular-nums text-foreground">
            {duration}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Offering time was not recorded. Start prayer next time to capture how long you offered it.
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {timed ? "Time you offered this prayer." : null}
        </p>
        <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <ButtonLink href="/my-prayers" className="w-full sm:w-auto">
            Back to my prayers
          </ButtonLink>
          <ButtonLink href="/completed" variant="outline" className="w-full sm:w-auto">
            See completed
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
