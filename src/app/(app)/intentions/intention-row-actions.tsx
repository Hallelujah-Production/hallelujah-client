"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import { deleteIntentionAction } from "@/app/actions/intentions";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { flashToast } from "@/lib/feedback/flash";
import { toast } from "@/lib/feedback/toast";
import type { IntentionStatus, PaymentStatus } from "@/lib/types";

export function IntentionRowActions({
  intentionId,
  reference,
  status,
  paymentStatus,
  compact = true,
  showView = true,
}: {
  intentionId: string;
  reference: string;
  status: IntentionStatus;
  paymentStatus: PaymentStatus;
  compact?: boolean;
  showView?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [menuPos, setMenuPos] = React.useState<{ top: number; right: number; openUp: boolean } | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();
  const closed = status === "COMPLETED" || status === "CANCELLED";
  const canEdit = !closed;
  const canDelete = !closed && paymentStatus !== "VERIFIED";

  const placeMenu = React.useCallback(() => {
    const btn = buttonRef.current?.getBoundingClientRect();
    if (!btn) return;
    const estimatedHeight = 148;
    const openUp = window.innerHeight - btn.bottom < estimatedHeight && btn.top > estimatedHeight;
    setMenuPos({
      top: openUp ? btn.top - 4 : btn.bottom + 4,
      right: window.innerWidth - btn.right,
      openUp,
    });
  }, []);

  React.useEffect(() => {
    if (!menuOpen) return;
    placeMenu();
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [menuOpen, placeMenu]);

  const runDelete = () =>
    startTransition(async () => {
      const result = await deleteIntentionAction(intentionId);
      setConfirmOpen(false);
      if (result.status === "error") {
        toast.error({
          title: "Unable to delete this intention",
          message: result.message ?? "Please try again.",
        });
        return;
      }
      const onList = pathname === "/intentions";
      if (onList) {
        toast.success({
          title: "Intention deleted",
          message: `${reference} was removed from intentions, payments and notifications.`,
        });
        router.refresh();
        return;
      }
      flashToast({
        tone: "success",
        title: "Intention deleted",
        message: `${reference} was removed from intentions, payments and notifications.`,
      });
      router.push("/intentions");
      router.refresh();
    });

  const confirm = (
    <ConfirmDialog
      open={confirmOpen}
      onClose={() => setConfirmOpen(false)}
      onConfirm={runDelete}
      title={`Delete ${reference}?`}
      description="This removes the intention, its payment record, proof image and related notifications from every list."
      confirmLabel="Delete intention"
      tone="destructive"
      pending={pending}
    />
  );

  if (!compact) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
        {showView ? (
          <ButtonLink href={`/intentions/${intentionId}`} variant="outline" size="sm">
            View
          </ButtonLink>
        ) : null}
        {canEdit ? (
          <ButtonLink href={`/intentions/${intentionId}/edit`} variant="outline" size="sm">
            Update
          </ButtonLink>
        ) : null}
        {canDelete ? (
          <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setConfirmOpen(true)} disabled={pending}>
            Delete
          </Button>
        ) : null}
        {confirm}
      </div>
    );
  }

  const menu = menuOpen && menuPos
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          style={{
            position: "fixed",
            right: menuPos.right,
            top: menuPos.openUp ? undefined : menuPos.top,
            bottom: menuPos.openUp ? window.innerHeight - menuPos.top : undefined,
            zIndex: 70,
          }}
          className="w-44 overflow-hidden rounded-md border border-border bg-card py-1 shadow-lg"
        >
          {showView ? (
            <Link
              href={`/intentions/${intentionId}`}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View
            </Link>
          ) : null}
          {canEdit ? (
            <Link
              href={`/intentions/${intentionId}/edit`}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Update
            </Link>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive-muted"
              onClick={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          ) : null}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${reference}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={() => setMenuOpen((open) => !open)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        suppressHydrationWarning
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      {menu}
      {confirm}
    </div>
  );
}
