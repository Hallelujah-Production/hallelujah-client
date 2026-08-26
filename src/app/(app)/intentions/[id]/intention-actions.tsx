"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Play, UserPlus, XCircle } from "lucide-react";
import {
  assignIntentionAction,
  cancelIntentionAction,
  completeIntentionAction,
  startIntentionAction,
} from "@/app/actions/intentions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form";
import type { IntentionStatus, User } from "@/lib/types";
import { notifyResult } from "@/lib/feedback/toast";

export function IntentionActions({
  intentionId,
  status,
  staff,
  assignedStaffId,
  paymentVerified,
  promptAssign = false,
}: {
  intentionId: string;
  status: IntentionStatus;
  staff: User[];
  assignedStaffId?: string;
  paymentVerified: boolean;
  promptAssign?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [dialog, setDialog] = React.useState<"assign" | "start" | "complete" | "cancel" | null>(
    promptAssign && staff.length ? "assign" : null,
  );
  const [staffId, setStaffId] = React.useState(assignedStaffId ?? staff[0]?.id ?? "");
  const [reason, setReason] = React.useState("");
  const closed = status === "COMPLETED" || status === "CANCELLED";
  const canStart = status === "ASSIGNED" || status === "PENDING_PRAYER";
  const canComplete = status === "PENDING_PRAYER" || status === "IN_PROGRESS";

  const run = (
    fn: () => Promise<{ status: string; message?: string }>,
    copy: { successTitle: string; errorTitle: string },
  ) => {
    startTransition(async () => {
      const result = await fn();
      notifyResult(result, copy);
      setDialog(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3" data-print="hide">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDialog("assign")}
          disabled={pending || closed || !staff.length}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {assignedStaffId ? "Reassign" : "Assign"}
        </Button>

        {canStart ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog("start")}
            disabled={pending || !assignedStaffId}
            title={!assignedStaffId ? "Assign the intention to a member of your team first" : undefined}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Start prayer
          </Button>
        ) : null}

        {canComplete ? (
          <Button
            size="sm"
            variant="success"
            onClick={() => setDialog("complete")}
            disabled={pending || !assignedStaffId}
            title={!assignedStaffId ? "Assign the intention to a member of your team first" : undefined}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Mark complete
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setDialog("cancel")}
          disabled={pending || closed}
          className="text-destructive hover:bg-destructive-muted"
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Button>
      </div>

      {!staff.length && !closed ? (
        <p className="text-xs text-muted-foreground">
          Add a Prayer Staff member on Team, allotted to this church, then assign them here. They
          will then see this intention on Dashboard, My Prayers, Upcoming and Completed.
        </p>
      ) : null}

      {!paymentVerified && !closed ? (
        <p className="text-xs text-muted-foreground">
          You can allot this prayer now. Confirm the offering on Payments when you want to issue
          the official receipt.
        </p>
      ) : null}

      {/* Assign */}
      <Dialog
        open={dialog === "assign"}
        onClose={() => setDialog(null)}
        title="Assign this prayer"
        description="Choose the priest, sister or brother who will offer this intention."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending || !staffId}
              onClick={() =>
                run(() => assignIntentionAction(intentionId, staffId), {
                  successTitle: "Intention assigned",
                  errorTitle: "Unable to assign this prayer",
                })
              }
            >
              {pending ? "Assigning…" : "Assign prayer"}
            </Button>
          </>
        }
      >
        <Field id="assign-staff" label="Prayer staff" required>
          {(aria) => (
            <Select {...aria} value={staffId} onChange={(event) => setStaffId(event.target.value)}>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <p className="mt-3 text-xs text-muted-foreground">
          They will see this intention under &ldquo;My Prayers&rdquo; and receive a
          notification.
        </p>
      </Dialog>

      <ConfirmDialog
        open={dialog === "start"}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          run(() => startIntentionAction(intentionId), {
            successTitle: "Prayer started",
            errorTitle: "Unable to start this prayer",
          })
        }
        title="Start this prayer?"
        description="This records that the assigned staff member has begun offering the intention."
        confirmLabel="Start prayer"
        pending={pending}
      />

      {/* Complete */}
      <ConfirmDialog
        open={dialog === "complete"}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          run(() => completeIntentionAction(intentionId), {
            successTitle: "Prayer completed",
            errorTitle: "Unable to complete this prayer",
          })
        }
        title="Mark this prayer as completed?"
        description="This records the completion time and the person who marked it. It can be seen by the family on their receipt."
        confirmLabel="Mark completed"
        tone="success"
        pending={pending}
      />

      {/* Cancel */}
      <Dialog
        open={dialog === "cancel"}
        onClose={() => setDialog(null)}
        title="Cancel this intention"
        description="Cancelled intentions stay in the register with their reason, so the record remains complete."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialog(null)} disabled={pending}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={pending || reason.trim().length < 4}
              onClick={() =>
                run(() => cancelIntentionAction(intentionId, reason.trim()), {
                  successTitle: "Intention cancelled",
                  errorTitle: "Unable to cancel this intention",
                })
              }
            >
              {pending ? "Cancelling…" : "Cancel intention"}
            </Button>
          </>
        }
      >
        <Field
          id="cancel-reason"
          label="Reason"
          required
          description="Written into the audit log and shown on the intention."
          error={reason && reason.trim().length < 4 ? "Give a short reason — at least a few words." : undefined}
        >
          {(aria) => (
            <Textarea
              {...aria}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Withdrawn by the family."
            />
          )}
        </Field>
      </Dialog>
    </div>
  );
}
