"use client";

import * as React from "react";
import { useActionState } from "react";
import { saveChurchProfileAction, type SettingsState } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Field, FormErrorSummary, FormRow, FormSection, Input, Textarea } from "@/components/ui/form";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { Church } from "@/lib/types";

const initialState: SettingsState = { status: "idle" };

export function ChurchProfileForm({ church }: { church: Church }) {
  const [state, formAction, pending] = useActionState(saveChurchProfileAction, initialState);
  useActionFeedback(state, { successTitle: "Profile saved", silentError: true });

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.status === "error" ? <FormErrorSummary message={state.message} /> : null}

      <FormSection
        title="Church profile"
        description="How your parish appears on its public page and at the top of every receipt."
      >
        <Field id="settings-name" label="Church name" required>
          {(aria) => <Input {...aria} name="name" defaultValue={church.name} />}
        </Field>

        <Field
          id="settings-tagline"
          label="Tagline"
          description="One line shown under the church name on the public page."
        >
          {(aria) => <Input {...aria} name="tagline" defaultValue={church.tagline} maxLength={90} />}
        </Field>

        <Field
          id="settings-description"
          label="About the parish"
          description="A short paragraph for visitors choosing a church."
        >
          {(aria) => (
            <Textarea {...aria} name="description" rows={4} defaultValue={church.description} maxLength={400} />
          )}
        </Field>
      </FormSection>

      <FormSection title="Contact information" description="Used on the public page and printed on receipts.">
        <FormRow>
          <Field id="settings-phone" label="Phone" required>
            {(aria) => <Input {...aria} name="phone" type="tel" defaultValue={church.phone} />}
          </Field>
          <Field id="settings-email" label="Email" required>
            {(aria) => <Input {...aria} name="email" type="email" defaultValue={church.email} />}
          </Field>
        </FormRow>
        <Field id="settings-website" label="Website">
          {(aria) => <Input {...aria} name="website" type="url" defaultValue={church.website ?? ""} />}
        </Field>
      </FormSection>

      <FormSection title="Address" description="Printed on every receipt your parish issues.">
        <Field id="settings-address1" label="Address line 1" required>
          {(aria) => <Input {...aria} name="addressLine1" defaultValue={church.addressLine1} />}
        </Field>
        <Field id="settings-address2" label="Address line 2">
          {(aria) => <Input {...aria} name="addressLine2" defaultValue={church.addressLine2 ?? ""} />}
        </Field>
        <FormRow className="sm:grid-cols-3">
          <Field id="settings-city" label="City" required>
            {(aria) => <Input {...aria} name="city" defaultValue={church.city} />}
          </Field>
          <Field id="settings-state" label="State" required>
            {(aria) => <Input {...aria} name="state" defaultValue={church.state} />}
          </Field>
          <Field id="settings-postal" label="PIN code" required>
            {(aria) => <Input {...aria} name="postalCode" defaultValue={church.postalCode} inputMode="numeric" />}
          </Field>
        </FormRow>
      </FormSection>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <p className="text-xs text-muted-foreground">
          This preview stores changes in memory. Persistence arrives with the backend.
        </p>
      </div>
    </form>
  );
}
