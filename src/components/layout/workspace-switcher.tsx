"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { switchWorkspaceAction } from "@/app/actions/auth";
import type { Church } from "@/lib/types";
import { notifyResult } from "@/lib/feedback/toast";

export function WorkspaceSwitcher({
  churches,
  currentId,
  compact = false,
}: {
  churches: Pick<Church, "id" | "name">[];
  currentId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = React.useTransition();
  if (churches.length < 2) return null;

  return (
    <label className={compact ? "min-w-0" : "block"}>
      <span className={compact ? "sr-only" : "mb-1.5 block text-xs font-medium text-muted-foreground"}>
        Parish
      </span>
      <select
        value={currentId}
        disabled={busy}
        aria-label="Switch parish"
        suppressHydrationWarning
        className={
          compact
            ? "h-9 w-[7.5rem] max-w-[38vw] truncate rounded-md border border-input bg-background px-2 text-sm text-foreground sm:w-auto sm:max-w-[14rem]"
            : "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
        }
        onChange={(event) => {
          const next = event.target.value;
          if (!next || next === currentId) return;
          startTransition(async () => {
            const result = await switchWorkspaceAction(next);
            notifyResult(result, {
              successTitle: "Parish switched",
              errorTitle: "Unable to switch parish",
            });
            if (result.status === "success") router.refresh();
          });
        }}
      >
        {churches.map((church) => (
          <option key={church.id} value={church.id}>
            {church.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function WorkspaceSwitchCard({ churchId, name }: { churchId: string; name: string }) {
  const router = useRouter();
  const [busy, startTransition] = React.useTransition();

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        startTransition(async () => {
          const result = await switchWorkspaceAction(churchId);
          notifyResult(result, {
            successTitle: "Parish switched",
            errorTitle: "Unable to switch parish",
          });
          if (result.status === "success") router.refresh();
        });
      }}
      className="w-full rounded-lg border border-border bg-card px-4 py-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70"
    >
      <p className="font-display text-sm font-semibold text-foreground">{name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{busy ? "Opening…" : "Switch to this parish"}</p>
    </button>
  );
}

type AssignedParish = Pick<Church, "id" | "name"> & {
  intentionCount?: number;
  completedCount?: number;
  pendingCount?: number;
  inProgressCount?: number;
};

export function AssignedChurchCard({
  church,
  active,
}: {
  church: AssignedParish;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = React.useTransition();
  const stats = [
    { label: "Sent", value: church.intentionCount ?? 0 },
    { label: "Completed", value: church.completedCount ?? 0 },
    { label: "Pending", value: church.pendingCount ?? 0 },
    { label: "In prayer", value: church.inProgressCount ?? 0 },
  ];

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-foreground">{church.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {active ? "Current workspace" : busy ? "Opening…" : "Switch to this parish"}
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="font-medium tabular-nums text-foreground">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );

  if (active) {
    return (
      <div className="rounded-lg border border-primary bg-primary-muted px-4 py-3.5 shadow-sm">{inner}</div>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        startTransition(async () => {
          const result = await switchWorkspaceAction(church.id);
          notifyResult(result, {
            successTitle: "Parish switched",
            errorTitle: "Unable to switch parish",
          });
          if (result.status === "success") router.refresh();
        });
      }}
      className="w-full rounded-lg border border-border bg-card px-4 py-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70"
    >
      {inner}
    </button>
  );
}
