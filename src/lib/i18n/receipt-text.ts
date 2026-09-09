import type { PrayerType } from "@/lib/types";
import { PARISH_TIMEZONE } from "@/lib/utils";
import type { ReceiptLocale } from "./locales";
import { receiptLabels } from "./receipt-labels";
import { translatedPhrase, translatedPrayerTypeName } from "./prayer-terms";
import { transliterate } from "./transliterate";

/**
 * Turning stored English data into the family's language.
 *
 * Two passes, in this order, because they answer different questions:
 *
 *   1. `prayer-terms.ts` translates words that carry meaning — "Healing"
 *      becomes "స్వస్థత", the Telugu word, not a Telugu spelling of the
 *      English one.
 *   2. `transliterate.ts` respells whatever is left. Names must take this
 *      path: "Grace Thomas" is a person, and translating it would be wrong.
 *
 * Digits never move. Amounts, receipt numbers, mobile numbers and years stay
 * in Latin figures in every language, so the counter can reconcile a printed
 * receipt against the register without reading the script.
 */

/** English glue words that carry nothing once the sentence changes script. */
const DROPPED = new Set(["the", "of", "a", "an"]);

function localizeWord(word: string, locale: ReceiptLocale): string {
  if (DROPPED.has(word.toLowerCase())) return "";
  return translatedPhrase(word, locale) ?? transliterate(word, locale);
}

/**
 * Free text a parish typed — a custom prayer type, the "prayer for" line.
 * Meaningful words are translated; the rest is respelled.
 */
export function localizeText(text: string, locale: ReceiptLocale): string {
  if (locale === "en" || !text) return text;
  return text
    .replace(/[A-Za-z]+/g, (word) => localizeWord(word, locale))
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * A person's name. Respelled only — never sent through the phrase dictionary,
 * or a parishioner called Grace would print as "blessing".
 */
export function localizeName(name: string, locale: ReceiptLocale): string {
  if (locale === "en" || !name) return name;
  return transliterate(name, locale);
}

/**
 * Prefers the catalogue translation keyed on `PrayerType.code`, so a parish
 * that renamed `THANKSGIVING` to "Birthday Thanksgiving" still gets proper
 * Telugu. Falls back to translating the stored name word by word.
 */
export function localizePrayerTypeName(
  prayerType: Pick<PrayerType, "code" | "name">,
  locale: ReceiptLocale,
): string {
  if (locale === "en") return prayerType.name;
  return translatedPrayerTypeName(prayerType.code, locale) ?? localizeText(prayerType.name, locale);
}

/**
 * `DD MMM YYYY` with the month name in the receipt's language and the day and
 * year in Latin digits — the same shape `formatDate` produces for English, so
 * the two printouts line up column for column.
 */
export function localizeDate(iso: string | undefined, locale: ReceiptLocale): string {
  if (!iso) return "—";
  const dateOnly = iso.length === 10;
  const d = new Date(dateOnly ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "—";

  // Same explicit zone as `formatDate`, so server render and hydration agree.
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "numeric",
    year: "numeric",
    timeZone: dateOnly ? "UTC" : PARISH_TIMEZONE,
  }).formatToParts(d);

  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const month = receiptLabels(locale).months[Number(value("month")) - 1];

  return `${value("day")} ${month} ${value("year")}`;
}
