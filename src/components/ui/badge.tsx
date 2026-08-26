import * as React from "react";
import { cn } from "@/lib/utils";
import type { IntentionStatus, PaymentMethod, PaymentStatus } from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/types";

type Tone = "neutral" | "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary-muted text-primary border-primary/15",
  secondary: "bg-secondary-muted text-secondary border-secondary/15",
  accent: "bg-accent-muted text-accent-foreground border-accent/25",
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning border-warning/25",
  danger: "bg-destructive-muted text-destructive border-destructive/20",
  info: "bg-info-muted text-info border-info/20",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Status badges                                                       */
/*                                                                     */
/* Status is never carried by colour alone: each badge pairs a glyph    */
/* with a written label so it survives greyscale printing and colour    */
/* vision deficiency.                                                  */
/* ------------------------------------------------------------------ */

const INTENTION_STATUS: Record<IntentionStatus, { label: string; tone: Tone; glyph: string }> = {
  CREATED: { label: "Created", tone: "neutral", glyph: "•" },
  PAYMENT_PENDING: { label: "Offering recorded", tone: "info", glyph: "₹" },
  PAID: { label: "Paid", tone: "success", glyph: "✓" },
  ASSIGNED: { label: "Assigned", tone: "primary", glyph: "◆" },
  PENDING_PRAYER: { label: "Pending prayer", tone: "warning", glyph: "◷" },
  IN_PROGRESS: { label: "In progress", tone: "secondary", glyph: "◐" },
  COMPLETED: { label: "Completed", tone: "success", glyph: "✓" },
  CANCELLED: { label: "Cancelled", tone: "danger", glyph: "✕" },
};

export const INTENTION_STATUS_OPTIONS = (
  Object.keys(INTENTION_STATUS) as IntentionStatus[]
).map((value) => ({ value, label: INTENTION_STATUS[value].label }));

export function StatusBadge({
  status,
  className,
}: {
  status: IntentionStatus;
  className?: string;
}) {
  const config = INTENTION_STATUS[status];
  return (
    <Badge tone={config.tone} className={className}>
      <span aria-hidden="true">{config.glyph}</span>
      {config.label}
    </Badge>
  );
}

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone; glyph: string }> = {
  PENDING_VERIFICATION: { label: "Awaiting verification", tone: "warning", glyph: "◷" },
  VERIFIED: { label: "Verified", tone: "success", glyph: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", glyph: "✕" },
};

export const PAYMENT_STATUS_OPTIONS = (
  Object.keys(PAYMENT_STATUS) as PaymentStatus[]
).map((value) => ({ value, label: PAYMENT_STATUS[value].label }));

export function PaymentStatusBadge({
  status,
  short,
  className,
}: {
  status: PaymentStatus;
  short?: boolean;
  className?: string;
}) {
  const config = PAYMENT_STATUS[status];
  return (
    <Badge tone={config.tone} className={className}>
      <span aria-hidden="true">{config.glyph}</span>
      {short
        ? status === "REJECTED"
          ? "Rejected"
          : status === "VERIFIED"
            ? "Verified"
            : "Awaiting"
        : config.label}
    </Badge>
  );
}

export function MethodBadge({
  method,
  className,
}: {
  method: PaymentMethod;
  className?: string;
}) {
  return (
    <Badge tone={method === "CASH" ? "secondary" : "primary"} className={className}>
      <span aria-hidden="true">{method === "CASH" ? "₹" : "⇄"}</span>
      {PAYMENT_METHOD_LABEL[method]}
    </Badge>
  );
}

export const PAYMENT_METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABEL[value] }));
