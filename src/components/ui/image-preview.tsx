"use client";

import * as React from "react";
import { Dialog } from "./dialog";
import { formatDateTime, formatFileSize } from "@/lib/utils";
import type { PaymentProof } from "@/lib/types";

/**
 * Payment proof preview.
 *
 * Proof images are sensitive records, so this component never renders an
 * arbitrary path or user-supplied markup. It accepts only an opaque proof
 * descriptor plus an already-validated raster source; SVG is deliberately not
 * a supported preview type because it can carry script.
 */
export function ImagePreview({
  proof,
  src,
  triggerLabel = "View Proof",
  className,
}: {
  proof: PaymentProof;
  src?: string;
  triggerLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const isRaster = /^image\/(png|jpe?g|webp|heic)$/i.test(proof.mimeType);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        }
        aria-haspopup="dialog"
        suppressHydrationWarning
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
          <circle cx="7" cy="8" r="1.4" />
          <path d="M3 14l4.5-4 3.5 3 3-2.5 3 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {triggerLabel}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Payment proof"
        description={`${proof.fileName} · ${formatFileSize(proof.sizeBytes)} · uploaded ${formatDateTime(proof.uploadedAt)}`}
        size="lg"
      >
        <div className="flex min-h-[16rem] items-center justify-center rounded-md border border-border bg-muted/50 p-4">
          {isRaster && (src || proof.previewUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element -- object-store blob, not a static asset
            <img
              src={src || proof.previewUrl}
              alt={`Payment proof: ${proof.fileName}`}
              className="max-h-[min(70dvh,32rem)] max-w-full rounded object-contain"
            />
          ) : (
            <div className="max-w-sm space-y-2 text-center">
              <span
                aria-hidden="true"
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-card text-2xl text-muted-foreground shadow-sm"
              >
                🧾
              </span>
              <p className="text-sm font-medium text-foreground">{proof.fileName}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                The stored image is held in private object storage. In the connected
                application it is served through a short-lived signed URL scoped to this
                church, so it can only be opened by staff of this parish.
              </p>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
