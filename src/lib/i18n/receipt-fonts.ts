import {
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import { localeScript, type ReceiptLocale } from "./locales";

/**
 * Indic faces for the receipt, self-hosted by `next/font` at build time — the
 * counter machine never has to have them installed, and print never waits on
 * a network round trip.
 *
 * `display: "block"` rather than "swap" on purpose. A swap would paint the
 * fallback first, and every Latin fallback lacks these glyphs, so the roll
 * would come out of the printer full of tofu boxes. Blocking leaves the text
 * invisible for a moment instead, and `AutoPrint` waits for `document.fonts`
 * before it opens the dialog.
 */
const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "600", "700"],
  display: "block",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "block",
});

const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "600", "700"],
  display: "block",
});

const kannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "600", "700"],
  display: "block",
});

const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "600", "700"],
  display: "block",
});

/** Empty for English, which keeps the app's own type. */
export function receiptFontClass(locale: ReceiptLocale): string {
  switch (localeScript(locale)) {
    case "telugu":
      return telugu.className;
    case "devanagari":
      return devanagari.className;
    case "tamil":
      return tamil.className;
    case "kannada":
      return kannada.className;
    case "malayalam":
      return malayalam.className;
    default:
      return "";
  }
}
