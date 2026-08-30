"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { assignChurchAdminAction, unassignChurchAdminAction } from "@/app/actions/churches";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form";
import { notifyResult } from "@/lib/feedback/toast";

export function ChurchAdminAssignmentManager({
  churchId,
  assignedIds,
  candidates,
}: {
  churchId: string;
  assignedIds: string[];
  candidates: { id: string; name: string; username: string }[];
}) {
  const router = useRouter();
  const [userId, setUserId] = React.useState("");
  const [busy, startTransition] = React.useTransition();
  const available = candidates.filter((c) => !assignedIds.includes(c.id));

  return (
    <div className="space-y-3">
      {available.length ? (
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (!userId) return;
            startTransition(async () => {
              const result = await assignChurchAdminAction(churchId, userId);
              notifyResult(result, {
                successTitle: "Administrator assigned",
                errorTitle: "Unable to assign",
              });
              if (result.status === "success") {
                setUserId("");
                router.refresh();
              }
            });
          }}
        >
          <Field id="assign-admin" label="Assign an existing administrator" className="min-w-0 flex-1">
            {(aria) => (
              <Select
                {...aria}
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
              >
                <option value="">Select a Church Admin…</option>
                {available.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} · {admin.username}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Button type="submit" size="sm" disabled={busy || !userId}>
            {busy ? "Assigning…" : "Assign"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Every Church Admin is already assigned here.</p>
      )}
    </div>
  );
}

export function UnassignAdminButton({
  churchId,
  userId,
  name,
}: {
  churchId: string;
  userId: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={busy}
      className="text-destructive hover:bg-destructive-muted"
      onClick={() => {
        startTransition(async () => {
          const result = await unassignChurchAdminAction(churchId, userId);
          notifyResult(result, {
            successTitle: "Assignment removed",
            errorTitle: "Unable to remove assignment",
          });
          if (result.status === "success") router.refresh();
        });
      }}
    >
      {busy ? "Removing…" : `Remove ${name.split(" ")[0]}`}
    </Button>
  );
}
