export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
  action?: ToastAction;
  duration: number;
}

export type ToastInput = {
  title: string;
  message?: string;
  action?: ToastAction;
  duration?: number;
};

type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];
let seq = 0;
let lastKey = "";
let lastAt = 0;

function emit() {
  for (const listener of listeners) listener(items);
}

function dedupe(key: string): boolean {
  const now = Date.now();
  if (key === lastKey && now - lastAt < 1600) return true;
  lastKey = key;
  lastAt = now;
  return false;
}

function push(tone: ToastTone, input: ToastInput): string | undefined {
  const key = `${tone}:${input.title}:${input.message ?? ""}`;
  if (dedupe(key)) return undefined;
  const id = `toast-${++seq}`;
  const duration =
    input.duration ?? (tone === "error" ? 7000 : tone === "warning" ? 6000 : 4200);
  items = [...items.slice(-4), { id, tone, duration, ...input }];
  emit();
  return id;
}

export const toast = {
  success: (input: ToastInput) => push("success", input),
  error: (input: ToastInput) => push("error", input),
  warning: (input: ToastInput) => push("warning", input),
  info: (input: ToastInput) => push("info", input),
  dismiss: (id: string) => {
    items = items.filter((item) => item.id !== id);
    emit();
  },
  clear: () => {
    items = [];
    emit();
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener(items);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function notifyResult(
  result: { status: string; message?: string },
  copy: { successTitle: string; errorTitle: string; successMessage?: string },
): void {
  if (result.status === "success") {
    toast.success({
      title: copy.successTitle,
      message: copy.successMessage ?? result.message,
    });
    return;
  }
  toast.error({
    title: copy.errorTitle,
    message: result.message ?? "Please try again.",
  });
}
