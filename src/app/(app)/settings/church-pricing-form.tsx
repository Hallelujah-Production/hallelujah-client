"use client";

import { useActionState } from "react";
import { saveChurchPricingAction, type SettingsState } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useActionFeedback } from "@/hooks/use-action-feedback";

const initial: SettingsState = { status: "idle" };

export function ChurchPricingForm({
  prayerTypeId,
  amountRupees,
}: {
  prayerTypeId: string;
  amountRupees: number;
}) {
  const [state, formAction, pending] = useActionState(saveChurchPricingAction, initial);
  useActionFeedback(state, {
    successTitle: "Offering amount updated",
    silentError: true,
  });

  return (
    <form action={formAction} className="mt-3 space-y-2 border-t border-border pt-3">
      <input type="hidden" name="prayerTypeId" value={prayerTypeId} />
      <label className="block text-xs text-muted-foreground" htmlFor={`amount-${prayerTypeId}`}>
        This parish&apos;s offering (₹, whole rupees)
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={`amount-${prayerTypeId}`}
          name="amount"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={amountRupees}
          className="h-9"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
