"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Plus, ShieldCheck, UserCog, CheckCircle2, KeyRound } from "lucide-react";
import {
  createTeamMemberAction,
  deleteTeamMemberAction,
  setTeamMemberActiveAction,
  updateTeamMemberRoleAction,
  type TeamActionState,
} from "@/app/actions/team";
import { switchWorkspaceAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import type { Role, UserView } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { notifyResult } from "@/lib/feedback/toast";
import { flashToast } from "@/lib/feedback/flash";
import { useActionFeedback } from "@/hooks/use-action-feedback";

const initialState: TeamActionState = { status: "idle" };

export function TeamManager({
  members,
  currentUserId,
  churchId,
  allottableChurches,
  defaultChurchId,
}: {
  members: UserView[];
  currentUserId: string;
  /** Super Admin church Team tab: staff belong to this parish. */
  churchId?: string;
  /** Church Admin: parishes this person may be allotted to. */
  allottableChurches?: { id: string; name: string }[];
  defaultChurchId?: string;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);
  const [showCreated, setShowCreated] = React.useState(false);
  const [state, formAction, pending] = useActionState(createTeamMemberAction, initialState);
  const [target, setTarget] = React.useState<UserView | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserView | null>(null);
  const [resetTarget, setResetTarget] = React.useState<UserView | null>(null);
  const [roleTarget, setRoleTarget] = React.useState<UserView | null>(null);
  const [role, setRole] = React.useState<Role>("CHURCH_STAFF");
  const [busy, startTransition] = React.useTransition();
  useActionFeedback(state, {
    successTitle: "User account created successfully.",
    silentSuccess: true,
    silentError: true,
  });

  React.useEffect(() => {
    if (state.status === "success") setShowCreated(true);
  }, [state]);

  const run = (
    fn: () => Promise<TeamActionState>,
    copy: { successTitle: string; errorTitle: string },
  ) => {
    startTransition(async () => {
      const result = await fn();
      notifyResult(result, copy);
      setTarget(null);
      setRoleTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"} in this church
        </p>
        <Button
          onClick={() => {
            setShowCreated(false);
            setAddOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add team member
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No team members yet. Add church staff to this parish.
        </p>
      ) : (
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <li key={member.id}>
            <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {member.avatarInitials}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-base font-semibold tracking-tight text-foreground">
                    {member.name}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">{member.username}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={member.role === "CHURCH_ADMIN" ? "primary" : "secondary"}>
                  {member.role === "CHURCH_ADMIN" ? "Church Admin" : "Church Staff"}
                </Badge>
                {member.invitationPending ? (
                  <Badge tone="accent">Needs password</Badge>
                ) : (
                  <Badge tone={member.isActive ? "success" : "neutral"}>
                    <span aria-hidden="true">{member.isActive ? "✓" : "•"}</span>
                    {member.isActive ? "Active" : "Deactivated"}
                  </Badge>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Assigned</dt>
                  <dd className="font-medium tabular-nums text-foreground">{member.assignedCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Completed</dt>
                  <dd className="font-medium tabular-nums text-foreground">{member.completedCount}</dd>
                </div>
              </dl>

              <p className="mt-3 text-xs text-muted-foreground">
                Joined {formatDate(member.createdAt)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || member.id === currentUserId}
                  onClick={() => {
                    setRoleTarget(member);
                    setRole(member.role);
                  }}
                >
                  <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
                  Change role
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || member.id === currentUserId}
                  onClick={() => setResetTarget(member)}
                >
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  {member.invitationPending ? "Set password" : "Reset password"}
                </Button>
                <Button
                  size="sm"
                  variant={member.isActive ? "outline" : "success"}
                  disabled={busy || member.id === currentUserId}
                  onClick={() => setTarget(member)}
                  className={member.isActive ? "text-destructive hover:bg-destructive-muted" : undefined}
                >
                  {member.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || member.id === currentUserId}
                  onClick={() => setDeleteTarget(member)}
                  className="text-destructive hover:bg-destructive-muted"
                >
                  Delete
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>
      )}

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={showCreated ? "Team member added" : "Add a team member"}
        description={
          showCreated
            ? "The account is ready. They sign in with the password you set, then choose a new one."
            : "Enter name, username, role, church, and a password. No invitation email is sent."
        }
      >
        {showCreated && state.status === "success" ? (
          <div className="space-y-4">
            <p className="flex items-start gap-2 rounded-md border border-success/25 bg-success-muted/50 px-3 py-2.5 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <span>{state.message}</span>
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">{state.memberName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Allotted church</dt>
                <dd className="font-medium text-foreground">{state.allottedChurchName}</dd>
              </div>
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
              They must choose a new password on first sign-in. You can reset it later from this list.
            </p>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {state.otherChurch && state.allottedChurchId ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    const nextChurchId = state.allottedChurchId;
                    if (!nextChurchId) return;
                    startTransition(async () => {
                      const result = await switchWorkspaceAction(nextChurchId);
                      notifyResult(result, {
                        successTitle: "Parish switched",
                        errorTitle: "Unable to switch parish",
                      });
                      if (result.status === "success") {
                        setAddOpen(false);
                        setShowCreated(false);
                        router.refresh();
                      }
                    });
                  }}
                >
                  Open {state.allottedChurchName} team
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  flashToast({
                    tone: "success",
                    title: "Team member added",
                    message: state.message,
                  });
                  setAddOpen(false);
                  setShowCreated(false);
                  router.refresh();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
        <form action={formAction} className="space-y-4" noValidate>
          {churchId ? <input type="hidden" name="churchId" value={churchId} /> : null}
          {state.status === "error" && state.message ? (
            <p role="alert" className="rounded-md border border-destructive/25 bg-destructive-muted px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <Field id="member-name" label="Full name" required error={state.fields?.name}>
            {(aria) => <Input {...aria} name="name" placeholder="Sr. Mary Grace" />}
          </Field>

          <Field id="member-username" label="Username" required error={state.fields?.username} description="They sign in with this username and the password you set.">
            {(aria) => (
              <Input {...aria} name="username" type="text" autoComplete="off" placeholder="fr.joseph" />
            )}
          </Field>

          <Field id="member-phone" label="Phone number" error={state.fields?.phone}>
            {(aria) => <Input {...aria} name="phone" type="tel" placeholder="+91 98765 43210" />}
          </Field>

          <Field
            id="member-role"
            label="Role"
            required
            description="Prayer staff see only the intentions assigned to them."
          >
            {(aria) => (
              <Select {...aria} name="role" defaultValue="CHURCH_STAFF">
                <option value="CHURCH_STAFF">Church Staff</option>
                <option value="CHURCH_ADMIN">Church Admin</option>
              </Select>
            )}
          </Field>

          {!churchId && allottableChurches && allottableChurches.length > 0 ? (
            <Field
              id="member-church"
              label="Allot to church"
              required
              error={state.fields?.churchId}
              description="This person will belong to the parish you choose. They only see that church's records. This Team list stays on the parish in the header."
            >
              {(aria) => (
                <Select
                  {...aria}
                  name="churchId"
                  defaultValue={defaultChurchId ?? allottableChurches[0]?.id}
                >
                  {allottableChurches.map((parish) => (
                    <option key={parish.id} value={parish.id}>
                      {parish.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : null}

          <Field
            id="member-password"
            label="Password"
            required
            error={state.fields?.password}
            description="At least 10 characters. They must choose a new password on first sign-in."
          >
            {(aria) => (
              <PasswordInput {...aria} name="password" autoComplete="new-password" minLength={10} />
            )}
          </Field>

          <Field id="member-confirm-password" label="Confirm password" required error={state.fields?.confirmPassword}>
            {(aria) => (
              <PasswordInput
                {...aria}
                name="confirmPassword"
                autoComplete="new-password"
                minLength={10}
              />
            )}
          </Field>

          <p className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            A church administrator cannot create a platform administrator. That role is
            issued by the Hallelujah team only.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Adding…" : "Add member"}
            </Button>
          </div>
        </form>
        )}
      </Dialog>

      <Dialog
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title={`Change role for ${roleTarget?.name ?? ""}`}
        description="Church Admins manage the whole parish workspace. Prayer Staff see only their assigned prayers."
        size="sm"
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRoleTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                roleTarget &&
                run(() => updateTeamMemberRoleAction(roleTarget.id, role), {
                  successTitle: "Role updated",
                  errorTitle: "Unable to change role",
                })
              }
            >
              {busy ? "Saving…" : "Save role"}
            </Button>
          </>
        }
      >
        <Field id="change-role" label="Role" required>
          {(aria) => (
            <Select {...aria} value={role} onChange={(event) => setRole(event.target.value as Role)}>
              <option value="CHURCH_STAFF">Church Staff</option>
              <option value="CHURCH_ADMIN">Church Admin</option>
            </Select>
          )}
        </Field>
      </Dialog>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={() =>
          target &&
          run(() => setTeamMemberActiveAction(target.id, !target.isActive), {
            successTitle: target.isActive ? "Account deactivated" : "Account activated",
            errorTitle: "Unable to update account",
          })
        }
        title={target?.isActive ? `Deactivate ${target.name}?` : `Activate ${target?.name}?`}
        description={
          target?.isActive
            ? "They will no longer be able to sign in, and will not appear when assigning prayers. Their completed prayers stay in the register."
            : "They will be able to sign in again and can be assigned prayers."
        }
        confirmLabel={target?.isActive ? "Deactivate" : "Activate"}
        tone={target?.isActive ? "destructive" : "success"}
        pending={busy}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          run(
            () => {
              setDeleteTarget(null);
              return deleteTeamMemberAction(deleteTarget.id);
            },
            { successTitle: "Account deleted", errorTitle: "Unable to delete account" },
          )
        }
        title={`Delete ${deleteTarget?.name ?? ""}?`}
        description="This permanently removes the account from the database. They cannot sign in again. This cannot be undone."
        confirmLabel="Delete account"
        tone="destructive"
        pending={busy}
      />

      <ResetPasswordDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        userId={resetTarget?.id ?? ""}
        userName={resetTarget?.name ?? ""}
        userEmail={resetTarget?.username}
      />
    </div>
  );
}
