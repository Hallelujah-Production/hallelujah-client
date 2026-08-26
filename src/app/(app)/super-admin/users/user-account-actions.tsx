"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  deleteTeamMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  setTeamMemberActiveAction,
} from "@/app/actions/team";
import { ConfirmDialog } from "@/components/ui/dialog";
import { notifyResult } from "@/lib/feedback/toast";

type Kind = "deactivate" | "activate" | "delete" | "resend" | "revoke" | null;

export function UserAccountActions({
  userId,
  userName,
  isActive,
  invitationPending,
  isSelf,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
  invitationPending?: boolean;
  isSelf?: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = React.useState<Kind>(null);
  const [pending, startTransition] = React.useTransition();
  const run = (
    fn: () => Promise<{ status: string; message?: string }>,
    copy: { successTitle: string; errorTitle: string },
  ) => {
    startTransition(async () => {
      const result = await fn();
      notifyResult(result, copy);
      setKind(null);
      router.refresh();
    });
  };

  return (
    <span className="flex flex-wrap items-center justify-end gap-2">
      {invitationPending ? (
        <>
          <button
            type="button"
            onClick={() =>
              run(() => resendInvitationAction(userId), {
                successTitle: "Invitation sent",
                errorTitle: "Unable to resend invitation",
              })
            }
            disabled={pending || isSelf}
            className="rounded px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            Resend invite
          </button>
          <button
            type="button"
            onClick={() => setKind("revoke")}
            disabled={pending || isSelf}
            className="rounded px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancel invite
          </button>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => setKind(isActive ? "deactivate" : "activate")}
        disabled={pending || isSelf}
        className={
          isActive
            ? "rounded px-2 py-1 text-sm font-medium text-destructive transition-colors hover:bg-destructive-muted disabled:opacity-50"
            : "rounded px-2 py-1 text-sm font-medium text-success transition-colors hover:bg-success-muted disabled:opacity-50"
        }
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>

      <button
        type="button"
        onClick={() => setKind("delete")}
        disabled={pending || isSelf}
        className="rounded px-2 py-1 text-sm font-medium text-destructive transition-colors hover:bg-destructive-muted disabled:opacity-50"
      >
        Delete
      </button>

      <ConfirmDialog
        open={kind === "deactivate" || kind === "activate"}
        onClose={() => setKind(null)}
        onConfirm={() =>
          run(() => setTeamMemberActiveAction(userId, !isActive), {
            successTitle: isActive ? "Account deactivated" : "Account activated",
            errorTitle: "Unable to update account",
          })
        }
        title={isActive ? `Deactivate ${userName}?` : `Activate ${userName}?`}
        description={
          isActive
            ? "They will no longer be able to sign in. Their records stay in place."
            : "They will be able to sign in again."
        }
        confirmLabel={isActive ? "Deactivate" : "Activate"}
        tone={isActive ? "destructive" : "success"}
        pending={pending}
      />

      <ConfirmDialog
        open={kind === "delete"}
        onClose={() => setKind(null)}
        onConfirm={() =>
          run(() => deleteTeamMemberAction(userId), {
            successTitle: "Account deleted",
            errorTitle: "Unable to delete account",
          })
        }
        title={`Delete ${userName}?`}
        description="This permanently removes the account from the database. They cannot sign in again. This cannot be undone."
        confirmLabel="Delete account"
        tone="destructive"
        pending={pending}
      />

      <ConfirmDialog
        open={kind === "revoke"}
        onClose={() => setKind(null)}
        onConfirm={() =>
          run(() => revokeInvitationAction(userId), {
            successTitle: "Invitation cancelled",
            errorTitle: "Unable to cancel invitation",
          })
        }
        title={`Cancel invitation for ${userName}?`}
        description="The current set-password link will stop working. You can send a new invitation later."
        confirmLabel="Cancel invitation"
        tone="destructive"
        pending={pending}
      />
    </span>
  );
}
