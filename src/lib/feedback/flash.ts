const KEY = "hallelujah.flash-toast";

export type FlashToast = {
  tone: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
};

export function flashToast(input: FlashToast): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(input));
  } catch {
    // Private mode can refuse sessionStorage.
  }
}

export function consumeFlashToast(): FlashToast | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as FlashToast;
    if (!parsed?.title || !parsed?.tone) return null;
    return parsed;
  } catch {
    return null;
  }
}
