"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  createPrayerTypeAction,
  togglePrayerTypeAction,
  type PrayerTypeState,
} from "@/app/actions/prayer-types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, FormErrorSummary, Input, Textarea } from "@/components/ui/form";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { notifyResult } from "@/lib/feedback/toast";
import type { PrayerType } from "@/lib/types";

const initial: PrayerTypeState = { status: "idle" };

export function CreatePrayerTypeForm() {
  const [state, formAction, pending] = useActionState(createPrayerTypeAction, initial);
  useActionFeedback(state, { successTitle: "Prayer type added", silentError: true });

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="font-display text-base font-semibold text-foreground">Add a prayer type</h2>
      {state.status === "error" ? <FormErrorSummary message={state.message} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="code" label="Code" required description="Uppercase, like NOVENA.">
          {(aria) => <Input {...aria} name="code" autoComplete="off" placeholder="NOVENA" />}
        </Field>
        <Field id="name" label="Name" required>
          {(aria) => <Input {...aria} name="name" placeholder="Novena" />}
        </Field>
      </div>
      <Field id="description" label="Description" required>
        {(aria) => <Textarea {...aria} name="description" rows={2} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="amount" label="Default offering (₹)" required>
          {(aria) => (
            <Input {...aria} name="amount" type="number" inputMode="numeric" min={0} step={1} defaultValue={500} />
          )}
        </Field>
        <Field id="durationMinutes" label="Duration (minutes)">
          {(aria) => (
            <Input
              {...aria}
              name="durationMinutes"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              defaultValue={15}
            />
          )}
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add prayer type"}
      </Button>
    </form>
  );
}

export function PrayerTypeStatusToggle({ type }: { type: PrayerType }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-1">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}>
        {pending ? "Saving…" : type.isActive ? "Deactivate" : "Activate"}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await togglePrayerTypeAction(type.id, !type.isActive);
            notifyResult(result, {
              successTitle: type.isActive ? "Prayer type deactivated" : "Prayer type activated",
              errorTitle: "Unable to update prayer type",
            });
            setOpen(false);
            router.refresh();
          })
        }
        title={type.isActive ? `Deactivate ${type.name}?` : `Activate ${type.name}?`}
        description={
          type.isActive
            ? "Churches will no longer be able to offer this prayer type for new intentions."
            : "Churches will be able to offer this prayer type again."
        }
        confirmLabel={type.isActive ? "Deactivate" : "Activate"}
        tone={type.isActive ? "destructive" : "success"}
        pending={pending}
      />
    </div>
  );
}
