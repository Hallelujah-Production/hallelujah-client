"use client";

import * as React from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

export interface ProofDescriptor {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl?: string;
}

/** Only raster formats the backend accepts. SVG is excluded on purpose:
 *  it is a document format that can carry script, and it has no business
 *  being a payment screenshot. */
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp";
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Payment proof uploader.
 *
 * The chosen file stays in the native `name="proof"` input so the Server Action
 * receives it as FormData. Preview uses a blob URL that is revoked on replace
 * or remove. The API stores the file in private object storage; this component
 * never sees an object-store URL or credential.
 */
export function ProofUploader({
  value,
  onChange,
  label = "Payment screenshot",
  description = "A photo or screenshot of the payment, up to 15 MB. JPG, PNG or WebP.",
  required,
  error,
}: {
  value: ProofDescriptor | null;
  onChange: (proof: ProofDescriptor | null) => void;
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputId = React.useId();

  // Object URLs are revoked when the descriptor is replaced or removed.
  React.useEffect(() => {
    const url = value?.previewUrl;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [value?.previewUrl]);

  const accept = (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);

    if (!ACCEPTED.includes(file.type)) {
      setLocalError(
        "That file type is not supported. Upload a JPG, PNG or WebP image of your payment.",
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError(
        `That image is ${formatFileSize(file.size)}. Please upload one under 15 MB.`,
      );
      return;
    }

    onChange({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      previewUrl: URL.createObjectURL(file),
    });
    if (inputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      inputRef.current.files = transfer.files;
    }
  };

  const shownError = error ?? localError ?? undefined;
  const describedBy = [`${inputId}-hint`, shownError ? `${inputId}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </label>
      <p id={`${inputId}-hint`} className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      {value ? (
        <div className="flex items-start gap-4 rounded-md border border-border bg-card p-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted">
            {value.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- in-memory object URL, never a static asset
              <img
                src={value.previewUrl}
                alt={`Preview of ${value.fileName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden="true" className="text-2xl">
                🧾
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{value.fileName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatFileSize(value.sizeBytes)} · {value.mimeType.replace("image/", "").toUpperCase()}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded border border-input bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                suppressHydrationWarning
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  if (value.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(value.previewUrl);
                  onChange(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="inline-flex items-center gap-1 rounded border border-destructive/25 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive-muted"
                suppressHydrationWarning
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            accept(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "rounded-md border border-dashed p-5 text-center transition-colors",
            dragging ? "border-primary bg-primary-muted" : "border-input bg-card",
            shownError && "border-destructive",
          )}
        >
          <span
            aria-hidden="true"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <ImageUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            suppressHydrationWarning
          >
            Choose an image
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            or drag it here from your files
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_ATTR}
        capture="environment"
        name="proof"
        className="sr-only"
        aria-describedby={describedBy || undefined}
        aria-invalid={shownError ? true : undefined}
        onChange={(event) => accept(event.target.files?.[0])}
        suppressHydrationWarning
      />

      {shownError ? (
        <p id={`${inputId}-error`} role="alert" className="flex items-start gap-1 text-xs font-medium text-destructive">
          <span aria-hidden="true">✕</span>
          <span>{shownError}</span>
        </p>
      ) : null}
    </div>
  );
}
