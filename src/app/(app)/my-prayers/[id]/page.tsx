import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { assertChurchStaff } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getStaffIntentionById } from "@/lib/services";
import type { IntentionView } from "@/lib/types";
import { PrayerElapsedTimer } from "@/components/domain/prayer-elapsed-timer";
import { formatDateTime, formatLongDate, formatPrayerDuration, formatTime, prayerTypeNames} from "@/lib/utils";
import { StaffPrayerActions } from "./complete-button";

export const metadata: Metadata = {
  title: "Prayer",
  robots: { index: false, follow: false },
};

function staffWorkLabel(status: IntentionView["status"]): string {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "CANCELLED") return "Cancelled";
  return "To offer";
}

/**
 * Compact prayer ticket. Actions sit in the header so Start is visible at
 * 100% zoom without scrolling through oversized rows.
 */
export default async function StaffPrayerTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, intention] = await Promise.all([getSession(), getStaffIntentionById("", "", id)]);
  const staffSession = assertChurchStaff(session);
  if (!intention) notFound();

  const completed = intention.status === "COMPLETED";
  const askedBy = intention.requestedBy || intention.customer.name;
  const family =
    intention.customer.name.trim().toLowerCase() !== askedBy.trim().toLowerCase()
      ? intention.customer.name
      : null;
  const address = intention.customer.addressLine?.trim() || "";
  const city = intention.customer.city?.trim() || "";
  const state = intention.church?.state?.trim() || "";
  const dateLabel = [
    formatLongDate(intention.prayerDate),
    intention.preferredTime ? formatTime(intention.preferredTime) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const rows: { label: string; value: string }[] = [
    { label: "Pray for", value: intention.prayerFor },
    { label: "Asked by", value: askedBy },
  ];
  if (family) rows.push({ label: "Family", value: family });
  if (address) rows.push({ label: "Address", value: address });
  if (city || state) {
    rows.push({ label: "City / state", value: [city, state].filter(Boolean).join(", ") });
  }
  rows.push({ label: "Prayer date", value: dateLabel });
  if (intention.message) rows.push({ label: "Intention", value: intention.message });
  if (completed) {
    rows.push({
      label: "Time offered",
      value: formatPrayerDuration(intention.startedAt, intention.completedAt),
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-3 font-sans">
      <Link
        href="/my-prayers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        My prayers
      </Link>

      <article className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-accent">
              Offer this prayer
            </p>
            <h1 className="mt-0.5 font-display text-lg font-semibold leading-snug tracking-tight">
              {prayerTypeNames(intention)}
            </h1>
            <p className="mt-0.5 text-xs tabular-nums text-primary-foreground/70">
              {intention.reference}
              <span className="mx-1.5 text-primary-foreground/40">·</span>
              {staffWorkLabel(intention.status)}
            </p>
          </div>
          {!completed ? (
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:pt-0.5">
              {intention.status === "IN_PROGRESS" && intention.startedAt ? (
                <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-primary-foreground/55">
                    Offering time
                  </p>
                  <p className="font-display text-2xl font-semibold leading-none tracking-tight text-accent">
                    <PrayerElapsedTimer startedAt={intention.startedAt} />
                  </p>
                </div>
              ) : null}
              <StaffPrayerActions
                intentionId={intention.id}
                prayerFor={intention.prayerFor}
                status={intention.status}
                startedAt={intention.startedAt}
                compact
              />
            </div>
          ) : null}
        </header>

        {completed ? (
          <div className="flex items-start gap-3 border-b border-success/20 bg-success-muted px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <div className="min-w-0 text-sm">
              <p className="font-display text-base font-semibold tabular-nums text-foreground">
                {formatPrayerDuration(intention.startedAt, intention.completedAt)}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                Completed {formatDateTime(intention.completedAt)}
                {intention.assignedStaff?.name || staffSession.currentUser.name
                  ? ` · ${intention.assignedStaff?.name ?? staffSession.currentUser.name}`
                  : null}
              </p>
            </div>
          </div>
        ) : null}

        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid gap-1 px-4 py-2.5 sm:grid-cols-[8.5rem_1fr] sm:items-start sm:gap-4"
            >
              <dt className="text-xs font-medium text-muted-foreground">{row.label}</dt>
              <dd className="text-sm leading-snug text-foreground [overflow-wrap:anywhere]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </article>

      <p className="text-xs text-muted-foreground">
        {intention.status === "IN_PROGRESS"
          ? "The timer started when you began. Mark completed when you have offered this prayer."
          : completed
            ? "This prayer has been offered. Church Admin and Super Admin can see the same offering time."
            : "Start when you begin offering this prayer. The timer records how long you offered it."}
      </p>
    </div>
  );
}
