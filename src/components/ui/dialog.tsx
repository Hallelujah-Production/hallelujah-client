"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * Modal built on the native <dialog> element.
 *
 * showModal() gives us the focus trap, the inert background, Escape-to-close
 * and the top-layer stacking for free — considerably more reliable than a
 * hand-rolled trap, and it keeps the client bundle small.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  descriptionClassName,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  descriptionClassName?: string;
  /** When false, Escape and backdrop clicks do not close the dialog. */
  dismissible?: boolean;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current && dismissible) onClose();
      }}
      className={cn(
        "w-[calc(100vw-2rem)] max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] overflow-y-auto rounded-lg border border-border bg-card p-0 text-foreground shadow-lg backdrop:bg-foreground/40 backdrop:backdrop-blur-[2px] open:animate-fade-in",
        size === "sm" && "max-w-md",
        size === "md" && "max-w-lg",
        size === "lg" && "max-w-3xl",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
        <h2 id={titleId} className="font-display text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {dismissible ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            suppressHydrationWarning
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          <span className="h-8 w-8" aria-hidden="true" />
        )}
      </div>

      {description || children ? (
        <div className="space-y-3 px-5 py-4">
          {description ? (
            <p
              id={descriptionId}
              className={cn("text-sm leading-relaxed text-muted-foreground", descriptionClassName)}
            >
              {description}
            </p>
          ) : null}
          {children}
        </div>
      ) : null}

      {footer ? (
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  pending,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "destructive" | "success";
  pending?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      dismissible={!pending}
      descriptionClassName={
        tone === "destructive"
          ? "rounded-md border border-destructive/20 bg-destructive-muted px-3.5 py-3 text-foreground"
          : undefined
      }
      footer={
        <>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              if (pending) return;
              onConfirm();
            }}
            disabled={pending}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
