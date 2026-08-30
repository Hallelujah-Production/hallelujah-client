"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { createChurchAction, type ChurchFormState } from "@/app/actions/churches";
import { Button } from "@/components/ui/button";
import { Field, FormErrorSummary, FormRow, FormSection, Input, Select, Textarea } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { slugify } from "@/lib/utils";

const initialState: ChurchFormState = { status: "idle" };

export function CreateChurchForm({
  existingAdmins,
}: {
  existingAdmins: { id: string; name: string; username: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createChurchAction, initialState);
  const [name, setName] = React.useState("");
  const [adminMode, setAdminMode] = React.useState<"existing" | "new">(
    existingAdmins.length ? "existing" : "new",
  );
  const errors = state.errors ?? {};
  useActionFeedback(state, {
    successTitle: "Church created",
    silentError: true,
  });

  React.useEffect(() => {
    if (state.status === "success" && state.slug) {
      router.push(`/super-admin/churches/${state.slug}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.status === "error" ? <FormErrorSummary message={state.message} /> : null}

      <FormSection
        title="Church details"
        description="These appear on the parish's public page and at the top of every receipt it issues."
      >
        <Field
          id="church-name"
          label="Church name"
          required
          error={errors.name}
          description={
            name ? `Public page will be /church/${slugify(name)}` : undefined
          }
        >
          {(aria) => (
            <Input
              {...aria}
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="St. Anne's Church"
            />
          )}
        </Field>

        <Field id="church-tagline" label="Tagline" error={errors.tagline}>
          {(aria) => (
            <Input {...aria} name="tagline" placeholder="A house of prayer for all people" maxLength={90} />
          )}
        </Field>

        <Field id="church-description" label="About the parish" error={errors.description}>
          {(aria) => (
            <Textarea
              {...aria}
              name="description"
              rows={3}
              maxLength={400}
              placeholder="A short paragraph for visitors choosing a church."
            />
          )}
        </Field>

        <Field id="church-address1" label="Address" required error={errors.addressLine1}>
          {(aria) => <Input {...aria} name="addressLine1" placeholder="12 Cathedral Road" />}
        </Field>

        <FormRow className="sm:grid-cols-3">
          <Field id="church-city" label="City" required error={errors.city}>
            {(aria) => <Input {...aria} name="city" placeholder="Visakhapatnam" />}
          </Field>
          <Field id="church-state" label="State" required error={errors.state}>
            {(aria) => <Input {...aria} name="state" defaultValue="Andhra Pradesh" />}
          </Field>
          <Field id="church-postal" label="PIN code" required error={errors.postalCode}>
            {(aria) => (
              <Input {...aria} name="postalCode" inputMode="numeric" maxLength={6} placeholder="530016" />
            )}
          </Field>
        </FormRow>

        <FormRow>
          <Field id="church-phone" label="Parish phone" required error={errors.phone}>
            {(aria) => <Input {...aria} name="phone" type="tel" placeholder="+91 89122 40118" />}
          </Field>
          <Field id="church-email" label="Parish email" required error={errors.email}>
            {(aria) => <Input {...aria} name="email" type="email" placeholder="office@stannes.org" />}
          </Field>
        </FormRow>
      </FormSection>

      <FormSection
        title="Church administrator"
        description="Assign an existing Church Admin, or create a new administrator account with a password. One administrator can serve more than one parish."
      >
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">How to assign the administrator</legend>
        {existingAdmins.length ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card px-3 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-muted">
            <input
              type="radio"
              name="adminMode"
              value="existing"
              className="mt-0.5"
              checked={adminMode === "existing"}
              onChange={() => setAdminMode("existing")}
            />
            <span>
              <span className="block font-medium text-foreground">Existing administrator</span>
              <span className="block text-xs text-muted-foreground">Assign someone who already administers another parish.</span>
            </span>
          </label>
        ) : null}
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card px-3 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-muted">
            <input
              type="radio"
              name="adminMode"
              value="new"
              className="mt-0.5"
              checked={adminMode === "new"}
              onChange={() => setAdminMode("new")}
            />
            <span>
              <span className="block font-medium text-foreground">New administrator</span>
              <span className="block text-xs text-muted-foreground">
                Create the account now with a password. No invitation email is sent.
              </span>
            </span>
          </label>
        </fieldset>

        {adminMode === "existing" ? (
          <Field id="admin-user" label="Administrator" required error={errors.adminUserId}>
            {(aria) => (
              <Select {...aria} name="adminUserId" defaultValue="">
                <option value="">Select a Church Admin…</option>
                {existingAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} · {admin.username}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : (
          <>
            <FormRow>
              <Field id="admin-name" label="Administrator name" required error={errors.adminName}>
                {(aria) => <Input {...aria} name="adminName" placeholder="Fr. George Mathew" />}
              </Field>
              <Field id="admin-username" label="Administrator username" required error={errors.adminUsername} description="They sign in with this username.">
                {(aria) => (
                  <Input {...aria} name="adminUsername" type="text" autoComplete="off" placeholder="stannes.admin" />
                )}
              </Field>
            </FormRow>

            <Field id="admin-phone" label="Administrator phone" error={errors.adminPhone}>
              {(aria) => <Input {...aria} name="adminPhone" type="tel" placeholder="+91 98765 43210" />}
            </Field>
            <FormRow>
              <Field
                id="admin-password"
                label="Administrator password"
                required
                error={errors.adminPassword}
                description="At least 10 characters. They must choose a new password on first sign-in."
              >
                {(aria) => (
                  <PasswordInput
                    {...aria}
                    name="adminPassword"
                    autoComplete="new-password"
                    minLength={10}
                  />
                )}
              </Field>
              <Field
                id="admin-confirm-password"
                label="Confirm password"
                required
                error={errors.adminConfirmPassword}
              >
                {(aria) => (
                  <PasswordInput
                    {...aria}
                    name="adminConfirmPassword"
                    autoComplete="new-password"
                    minLength={10}
                  />
                )}
              </Field>
            </FormRow>
          </>
        )}

        <p className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          The administrator can then add their own prayer staff for this church. They can never create a
          platform administrator, and they can never reach another church&apos;s records unless you assign them.
        </p>
      </FormSection>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating church…" : "Create church"}
        </Button>
        <p className="text-xs text-muted-foreground">
          This preview stores the new tenant in memory only.
        </p>
      </div>
    </form>
  );
}
