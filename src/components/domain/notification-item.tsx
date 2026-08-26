"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeIndianRupee,
  BellRing,
  CalendarClock,
  CheckCircle2,
  FileText,
  Info,
  ShieldCheck,
  Sparkles,
  UserPlus,
  XCircle,
} from "lucide-react";
import { markReadAction } from "@/app/actions/notifications";
import type { AppNotification, NotificationType } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { toast } from "@/lib/feedback/toast";

const ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  NEW_INTENTION: Sparkles,
  NEW_ASSIGNMENT: UserPlus,
  PAYMENT_VERIFICATION: ShieldCheck,
  PAYMENT_VERIFIED: BadgeIndianRupee,
  PAYMENT_REJECTED: XCircle,
  RECEIPT_ISSUED: FileText,
  PRAYER_DUE_TODAY: BellRing,
  UPCOMING_PRAYER: CalendarClock,
  PRAYER_COMPLETED: CheckCircle2,
  SYSTEM: Info,
};

const TONES: Record<NotificationType, string> = {
  NEW_INTENTION: "bg-primary-muted text-primary",
  NEW_ASSIGNMENT: "bg-secondary-muted text-secondary",
  PAYMENT_VERIFICATION: "bg-warning-muted text-warning",
  PAYMENT_VERIFIED: "bg-success-muted text-success",
  PAYMENT_REJECTED: "bg-destructive-muted text-destructive",
  RECEIPT_ISSUED: "bg-accent-muted text-accent",
  PRAYER_DUE_TODAY: "bg-accent-muted text-accent",
  UPCOMING_PRAYER: "bg-info-muted text-info",
  PRAYER_COMPLETED: "bg-success-muted text-success",
  SYSTEM: "bg-muted text-muted-foreground",
};

export function NotificationItem({ notification }: { notification: AppNotification }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const Icon = ICONS[notification.type];

  const markRead = () => {
    if (notification.isRead) return;
    startTransition(async () => {
      await markReadAction(notification.id);
      router.refresh();
    });
  };

  const body = (
    <div className="flex items-start gap-3.5">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          TONES[notification.type],
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm font-semibold text-foreground">
            {notification.title}
          </p>
          {!notification.isRead ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-accent-foreground">
              New
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  return (
    <li
      className={cn(
        "rounded-lg border p-4 transition-colors",
        notification.isRead ? "border-border bg-card" : "border-primary/20 bg-primary-muted/40",
      )}
    >
      {notification.href ? (
        <Link href={notification.href} onClick={markRead} className="block rounded outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {body}
        </Link>
      ) : (
        body
      )}

      {!notification.isRead ? (
        <div className="mt-3 flex justify-end border-t border-border/60 pt-2.5">
          <button
            type="button"
            onClick={markRead}
            disabled={pending}
            className="rounded px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-card disabled:opacity-50"
            suppressHydrationWarning
          >
            {pending ? "Marking…" : "Mark as read"}
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const { markAllReadAction } = await import("@/app/actions/notifications");
          const result = await markAllReadAction();
          if (result.ok) {
            toast.success({ title: "Notifications cleared", message: "All notifications are marked as read." });
          } else {
            toast.error({ title: "Unable to update notifications", message: "Please sign in again and try once more." });
          }
          router.refresh();
        })
      }
      className="inline-flex h-9 items-center rounded-md border border-input bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      suppressHydrationWarning
    >
      {pending ? "Marking…" : "Mark all read"}
    </button>
  );
}
