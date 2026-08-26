"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setTeamMemberActiveAction } from "@/app/actions/team";
import { ConfirmDialog } from "@/components/ui/dialog";
import { notifyResult } from "@/lib/feedback/toast";

export function UserStatusToggle({
  userId,
  userName,
  isActive,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={
          isActive
            ? "rounded px-2 py-1 text-sm font-medium text-destructive transition-colors hover:bg-destructive-muted disabled:opacity-50"
            : "rounded px-2 py-1 text-sm font-medium text-success transition-colors hover:bg-success-muted disabled:opacity-50"
        }
        suppressHydrationWarning
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await setTeamMemberActiveAction(userId, !isActive);
            notifyResult(result, {
              successTitle: isActive ? "Account deactivated" : "Account activated",
              errorTitle: "Unable to update account",
            });
            setOpen(false);
            router.refresh();
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
    </>
  );
}
