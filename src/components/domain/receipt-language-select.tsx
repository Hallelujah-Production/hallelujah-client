"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { Select } from "@/components/ui/form";
import {
  DEFAULT_RECEIPT_LOCALE,
  RECEIPT_LOCALES,
  type ReceiptLocale,
} from "@/lib/i18n/locales";

/**
 * Picks the language the receipt is rendered and printed in.
 *
 * The choice lives in `?lang=`, not in component state, so the server renders
 * the translated receipt directly — the preview on screen is byte for byte
 * what the printer will produce, and a counter can bookmark or re-open the URL
 * for a family whose language it already knows. Works the same on a receipt
 * issued this minute and on one from two years ago.
 */
export function ReceiptLanguageSelect({
  value = DEFAULT_RECEIPT_LOCALE,
  className,
}: {
  value?: ReceiptLocale;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const change = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_RECEIPT_LOCALE) params.delete("lang");
    else params.set("lang", next);
    // Re-opening the print dialog is the operator's call, not a side effect
    // of changing the language.
    params.delete("print");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div data-print="hide" className={className}>
      <label
        htmlFor="receipt-language"
        className="mb-1 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
      >
        <Languages className="h-3.5 w-3.5" aria-hidden="true" />
        Receipt language
      </label>
      <Select
        id="receipt-language"
        value={value}
        onChange={(event) => change(event.target.value)}
        className="h-9 w-[12rem] text-sm"
      >
        {RECEIPT_LOCALES.map((locale) => (
          <option key={locale.code} value={locale.code}>
            {locale.code === "en" ? locale.label : `${locale.nativeLabel} — ${locale.label}`}
          </option>
        ))}
      </Select>
    </div>
  );
}
