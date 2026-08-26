"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setChurchActiveAction } from "@/app/actions/churches";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { notifyResult } from "@/lib/feedback/toast";

export function ChurchStatusToggle({
  churchId,
  churchName,
  isActive,
  size = "sm",
}: {
  churchId: string;
  churchName: string;
  isActive: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <>
      <Button
        size={size}
        variant={isActive ? "outline" : "success"}
        onClick={() => setOpen(true)}
        disabled={pending}
        className={isActive ? "text-destructive hover:bg-destructive-muted" : undefined}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await setChurchActiveAction(churchId, !isActive);
            notifyResult(result, {
              successTitle: isActive ? "Church deactivated" : "Church activated",
              errorTitle: "Unable to update church",
            });
            setOpen(false);
            router.refresh();
          })
        }
        title={isActive ? `Deactivate ${churchName}?` : `Activate ${churchName}?`}
        description={
          isActive
            ? "Its public page is removed from the directory and its staff can no longer sign in. Existing intentions, payments and receipts are kept."
            : "Its public page returns to the directory and its staff can sign in again."
        }
        confirmLabel={isActive ? "Deactivate church" : "Activate church"}
        tone={isActive ? "destructive" : "success"}
        pending={pending}
      />
    </>
  );
}
