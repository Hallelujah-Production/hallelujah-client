/**
 * Languages an official receipt can be printed in.
 *
 * Elderly parishioners often cannot read English, so the counter picks the
 * family's language before printing. Every locale here must have a full label
 * set in `receipt-labels.ts` and a font stack in `receipt-fonts.ts` — a missing
 * font prints tofu boxes on the thermal roll, which is worse than English.
 */
export const RECEIPT_LOCALES = [
  { code: "en", label: "English", nativeLabel: "English", script: "latin" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", script: "telugu" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", script: "devanagari" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", script: "devanagari" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", script: "tamil" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", script: "kannada" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", script: "malayalam" },
] as const;

export type ReceiptLocale = (typeof RECEIPT_LOCALES)[number]["code"];
export type ReceiptScript = (typeof RECEIPT_LOCALES)[number]["script"];

export const DEFAULT_RECEIPT_LOCALE: ReceiptLocale = "en";

const CODES = new Set<string>(RECEIPT_LOCALES.map((l) => l.code));

export function isReceiptLocale(value: unknown): value is ReceiptLocale {
  return typeof value === "string" && CODES.has(value);
}

/** Reads `?lang=` off a search param, falling back to English. */
export function resolveReceiptLocale(value: unknown): ReceiptLocale {
  const raw = Array.isArray(value) ? value[0] : value;
  return isReceiptLocale(raw) ? raw : DEFAULT_RECEIPT_LOCALE;
}

export function localeScript(locale: ReceiptLocale): ReceiptScript {
  return RECEIPT_LOCALES.find((l) => l.code === locale)?.script ?? "latin";
}

export function localeNativeLabel(locale: ReceiptLocale): string {
  return RECEIPT_LOCALES.find((l) => l.code === locale)?.nativeLabel ?? "English";
}
