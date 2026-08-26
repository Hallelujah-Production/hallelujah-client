"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { rejectPaymentAction, verifyPaymentAction } from "@/app/actions/intentions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import type { PaymentStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { notifyResult, toast } from "@/lib/feedback/toast";

const REASONS = [
  "Transaction reference could not be traced in the parish account.",
  "Amount did not match the counter register for the day.",
  "Duplicate of an offering already recorded.",
  "The family withdrew this intention.",
];

export function VerificationActions({
  paymentId,
  status,
  amount,
  method,
}: {
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  method: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [dialog, setDialog] = React.useState<"verify" | "reject" | null>(null);
  const [reason, setReason] = React.useState("");
  const run = (
    fn: () => Promise<{ status: string; message?: string }>,
    copy: { successTitle: string; errorTitle: string },
  ) => {
    startTransition(async () => {
      const result = await fn();
      if (result.status === "success" && copy.successTitle === "Payment verified") {
        toast.success({
          title: "Payment verified",
          message: result.message,
          action: { label: "View receipts", href: "/receipts" },
        });
      } else {
        notifyResult(result, copy);
      }
      setDialog(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3" data-print="hide">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="success"
          onClick={() => setDialog("verify")}
          disabled={pending || status === "VERIFIED"}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Verify Payment
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:bg-destructive-muted"
          onClick={() => setDialog("reject")}
          disabled={pending || status === "REJECTED"}
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Reject Payment
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Verifying confirms this offering against your own register. It moves no money —
        the payment was made to the church directly.
      </p>

      <ConfirmDialog
        open={dialog === "verify"}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          run(() => verifyPaymentAction(paymentId), {
            successTitle: "Payment verified",
            errorTitle: "Unable to verify this payment",
          })
        }
        title="Verify this payment?"
        description={`Confirm that ${formatCurrency(amount)} was received by ${method.toLowerCase() === "cash" ? "the parish counter" : "the parish account"}. The receipt is then authorised and the intention enters the prayer workflow.`}
        confirmLabel="Verify payment"
        tone="success"
        pending={pending}
      />

      <Dialog
        open={dialog === "reject"}
        onClose={() => setDialog(null)}
        title="Reject this payment"
        description="Say why it could not be reconciled. The reason is written to the audit log and shown on the intention."
        dismissible={!pending}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={pending || reason.trim().length < 4}
              onClick={() =>
                run(() => rejectPaymentAction(paymentId, reason.trim()), {
                  successTitle: "Payment rejected",
                  errorTitle: "Unable to reject this payment",
                })
              }
            >
              {pending ? "Rejecting…" : "Reject payment"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field id="reject-reason" label="Reason" required>
            {(aria) => (
              <Textarea
                {...aria}
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Transaction reference could not be traced in the parish account."
              />
            )}
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className="rounded border border-input bg-card px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                suppressHydrationWarning
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
