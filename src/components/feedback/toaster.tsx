"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { toast, type ToastItem, type ToastTone } from "@/lib/feedback/toast";
import { consumeFlashToast } from "@/lib/feedback/flash";
import { cn } from "@/lib/utils";

const TONE: Record<
  ToastTone,
  { icon: typeof CheckCircle2; wrap: string; iconWrap: string }
> = {
  success: {
    icon: CheckCircle2,
    wrap: "border-success/20 bg-card",
    iconWrap: "bg-success-muted text-success",
  },
  error: {
    icon: XCircle,
    wrap: "border-destructive/20 bg-card",
    iconWrap: "bg-destructive-muted text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    wrap: "border-warning/20 bg-card",
    iconWrap: "bg-warning-muted text-warning",
  },
  info: {
    icon: Info,
    wrap: "border-primary/15 bg-card",
    iconWrap: "bg-primary-muted text-primary",
  },
};

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const pathname = usePathname();

  React.useEffect(() => {
    return toast.subscribe(setItems);
  }, []);

  React.useEffect(() => {
    const flash = consumeFlashToast();
    if (flash) toast[flash.tone]({ title: flash.title, message: flash.message, duration: 5600 });
  }, [pathname]);

  return (
    <div
      data-print="hide"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[100] flex flex-col gap-2 lg:inset-x-auto lg:bottom-5 lg:right-5 lg:w-[22.5rem]"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const tone = TONE[item.tone];
  const Icon = tone.icon;
  const touchX = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (item.duration <= 0) return;
    const timer = window.setTimeout(() => toast.dismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [item.id, item.duration]);

  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex gap-3 rounded-lg border p-3.5 shadow-md motion-safe:animate-fade-up",
        tone.wrap,
      )}
      onTouchStart={(event) => {
        touchX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchX.current;
        const end = event.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start == null || end == null) return;
        if (Math.abs(end - start) > 72) toast.dismiss(item.id);
      }}
    >
      <span
        aria-hidden="true"
        className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", tone.iconWrap)}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-foreground">{item.title}</p>
        {item.message ? (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.message}</p>
        ) : null}
        {item.action ? (
          item.action.href ? (
            <Link
              href={item.action.href}
              className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => toast.dismiss(item.id)}
            >
              {item.action.label}
            </Link>
          ) : (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                item.action?.onClick?.();
                toast.dismiss(item.id);
              }}
            >
              {item.action.label}
            </button>
          )
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(item.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
