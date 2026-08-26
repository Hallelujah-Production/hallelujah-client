"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteChurchAction } from "@/app/actions/churches";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { notifyResult } from "@/lib/feedback/toast";

export function ChurchDeleteButton({
  churchId,
  churchName,
  size = "sm",
  redirectTo,
}: {
  churchId: string;
  churchName: string;
  size?: "sm" | "md";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  return (
    <>
      <Button
        size={size}
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="text-destructive hover:bg-destructive-muted"
      >
        Delete
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteChurchAction(churchId);
            notifyResult(result, {
              successTitle: "Church deleted",
              errorTitle: "Unable to delete church",
            });
            setOpen(false);
            if (result.status === "error") return;
            if (redirectTo) router.replace(redirectTo);
            else router.refresh();
          })
        }
        title={`Delete ${churchName}?`}
        description="This permanently deletes the church and everything that belongs to it — the team, intentions, payments and receipts. This cannot be undone."
        confirmLabel="Delete church"
        tone="destructive"
        pending={pending}
      />
    </>
  );
}
