"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { ShieldAlert } from "lucide-react";
import { createTeamMemberAction, type TeamActionState } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Field, FormErrorSummary, FormRow, Input, Select } from "@/components/ui/form";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { Church, Role } from "@/lib/types";

const initialState: TeamActionState = { status: "idle" };

export function CreateUserForm({ churches }: { churches: Church[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createTeamMemberAction, initialState);
  const [role, setRole] = React.useState<Role>("CHURCH_ADMIN");
  useActionFeedback(state, { successTitle: "Invitation sent", silentError: true });

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
        <Field id="user-name" label="Full name" required>
          {(aria) => <Input {...aria} name="name" placeholder="Fr. George Mathew" />}
        </Field>
        <Field id="user-email" label="Email address" required>
          {(aria) => (
            <Input {...aria} name="email" type="email" placeholder="admin@st-marys.example.com" />
          )}
        </Field>
      </FormRow>

      <FormRow>
        <Field id="user-phone" label="Phone number">
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
          description="The parish this account is allotted to. They sign in with this email and password. Super Admin can later allot the same person to another church — still one login."
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

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-xs text-muted-foreground">
          There is no password field. They receive an email, open the link, and set their own
          password, then sign in with that email.
        </p>
      </div>
    </form>
  );
}
