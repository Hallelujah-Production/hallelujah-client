"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { updateIntentionAction, type ActionState } from "@/app/actions/intentions";
import { Button } from "@/components/ui/button";
import { Field, FormRow, Input, Select, Textarea } from "@/components/ui/form";
import { flashToast } from "@/lib/feedback/flash";
import { addDays, TODAY } from "@/lib/utils";
import type { IntentionView } from "@/lib/types";

const initial: ActionState = { status: "idle" };

export function IntentionEditForm({ intention }: { intention: IntentionView }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionState, formData: FormData) => updateIntentionAction(intention.id, formData),
    initial,
  );

  React.useEffect(() => {
    if (state.status !== "success") return;
    flashToast({ tone: "success", title: "Intention updated", message: state.message });
    router.push(`/intentions/${intention.id}`);
    router.refresh();
  }, [state, router, intention.id]);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" && state.message ? (
        <p role="alert" className="rounded-md border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <FormRow>
        <Field id="prayerFor" label="Prayer is offered for" required>
          {(aria) => (
            <Input {...aria} name="prayerFor" defaultValue={intention.prayerFor} maxLength={80} />
          )}
        </Field>
        <Field id="requestedBy" label="Requested by">
          {(aria) => (
            <Input {...aria} name="requestedBy" defaultValue={intention.requestedBy} maxLength={80} />
          )}
        </Field>
      </FormRow>

      <FormRow>
        <Field id="prayerDate" label="Prayer date" required>
          {(aria) => (
            <Input
              {...aria}
              name="prayerDate"
              type="date"
              min={TODAY}
              max={addDays(TODAY, 365)}
              defaultValue={intention.prayerDate}
            />
          )}
        </Field>
        <Field id="preferredTime" label="Preferred time">
          {(aria) => (
            <Select {...aria} name="preferredTime" defaultValue={intention.preferredTime ?? ""}>
              <option value="">No preference</option>
              {["06:00", "06:30", "07:00", "09:00", "10:00", "16:00", "17:00", "18:00"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </FormRow>

      <Field id="message" label="Message to the church">
        {(aria) => (
          <Textarea {...aria} name="message" defaultValue={intention.message ?? ""} maxLength={500} />
        )}
      </Field>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
