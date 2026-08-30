"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { ShieldAlert } from "lucide-react";
import { createTeamMemberAction, type TeamActionState } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Field, FormErrorSummary, FormRow, Input, Select } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { ChurchView, Role } from "@/lib/types";

const initialState: TeamActionState = { status: "idle" };

export function CreateUserForm({ churches }: { churches: Pick<ChurchView, "id" | "name" | "city">[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createTeamMemberAction, initialState);
  const [role, setRole] = React.useState<Role>("CHURCH_ADMIN");
  useActionFeedback(state, { successTitle: "User account created successfully.", silentError: true });

  React.useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => router.push("/super-admin/users"), 900);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  const needsChurch = role !== "SUPER_ADMIN";

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" ? <FormErrorSummary message={state.message} /> : null}

      <FormRow>
        <Field id="user-name" label="Full name" required error={state.fields?.name}>
          {(aria) => <Input {...aria} name="name" placeholder="Fr. George Mathew" />}
        </Field>
        <Field id="user-username" label="Username" required error={state.fields?.username} description="They sign in with this username. Letters, numbers, dots, hyphens, underscores.">
          {(aria) => (
            <Input {...aria} name="username" type="text" autoComplete="off" placeholder="fr.george" />
          )}
        </Field>
      </FormRow>

      <FormRow>
        <Field id="user-phone" label="Phone number" error={state.fields?.phone}>
          {(aria) => <Input {...aria} name="phone" type="tel" placeholder="+91 98765 43210" />}
        </Field>

        <Field
          id="user-role"
          label="Role"
          required
          description="Platform administrators are not tied to a church."
        >
          {(aria) => (
            <Select
              {...aria}
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              <option value="CHURCH_ADMIN">Church Admin</option>
              <option value="CHURCH_STAFF">Church Staff</option>
              <option value="SUPER_ADMIN">Super Admin (platform)</option>
            </Select>
          )}
        </Field>
      </FormRow>

      {needsChurch ? (
        <Field
          id="user-church"
          label="Church"
          required
          error={state.fields?.churchId}
          description="The parish this account is allotted to. They sign in with this username and the password you set. Super Admin can later allot the same person to another church — still one login."
        >
          {(aria) => (
            <Select {...aria} name="churchId" defaultValue={churches[0]?.id}>
              {churches.map((church) => (
                <option key={church.id} value={church.id}>
                  {church.name} — {church.city}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : (
        <p className="flex items-start gap-2 rounded-md border border-accent/25 bg-accent-muted/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          A platform administrator can see every church on Hallelujah. Create these accounts
          sparingly — each one is recorded in the audit log.
        </p>
      )}

      <FormRow>
        <Field
          id="user-password"
          label="Password"
          required
          error={state.fields?.password}
          description="At least 10 characters. They must choose a new password on first sign-in."
        >
          {(aria) => (
            <PasswordInput {...aria} name="password" autoComplete="new-password" minLength={10} />
          )}
        </Field>
        <Field id="user-confirm-password" label="Confirm password" required error={state.fields?.confirmPassword}>
          {(aria) => (
            <PasswordInput
              {...aria}
              name="confirmPassword"
              autoComplete="new-password"
              minLength={10}
            />
          )}
        </Field>
      </FormRow>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-xs text-muted-foreground">
          The account is ready immediately. No invitation email is sent.
        </p>
      </div>
    </form>
  );
}
