import { type ReceiptView } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { DEFAULT_RECEIPT_LOCALE, type ReceiptLocale } from "@/lib/i18n/locales";
import { receiptFontClass } from "@/lib/i18n/receipt-fonts";
import { receiptLabels } from "@/lib/i18n/receipt-labels";
import {
  localizeDate,
  localizeName,
  localizePrayerTypeName,
  localizeText,
} from "@/lib/i18n/receipt-text";

/** Print-receipt crest only. Do not use on the app chrome or public site. */
const RECEIPT_LOGO_SRC = "/brand/receipt-logo.jpeg";

/** Standard 80mm thermal / POS roll. Height follows content — never a fixed page. */
export const THERMAL_WIDTH_MM = 80;

/**
 * Compact 80mm thermal receipt. Screen preview is the same width as the roll.
 *
 * `locale` prints the whole document in the family's language — many
 * parishioners cannot read English. Two things deliberately do not move:
 * the church's own name, which is its legal identity, and every figure
 * (amount, receipt number, mobile, year), which the counter reconciles
 * against the register by eye.
 */
export function Receipt({
  receipt,
  locale = DEFAULT_RECEIPT_LOCALE,
  className,
}: {
  receipt: ReceiptView;
  locale?: ReceiptLocale;
  className?: string;
}) {
  const { church, customer, intention, prayerType, payment } = receipt;
  const t = receiptLabels(locale);
  const latin = locale === "en";

  const locality = localizeText(
    [church.addressLine1, church.city].filter(Boolean).join(", "),
    locale,
  );
  const customerName = localizeName(customer.name, locale);
  const prayerTypeName = localizePrayerTypeName(prayerType, locale);

  const requestedBy = intention.requestedBy?.trim();
  const showRequestedBy =
    Boolean(requestedBy) &&
    requestedBy.toLowerCase() !== customer.name.trim().toLowerCase() &&
    requestedBy.toLowerCase() !== (receipt.receivedBy?.name ?? "").trim().toLowerCase();

  const statusText = {
    PENDING_VERIFICATION: t.statusPending,
    VERIFIED: t.statusVerified,
    REJECTED: t.statusRejected,
  }[payment.status];

  const methodText = payment.method === "CASH" ? t.methodCash : t.methodUpi;

  return (
    <article
      id="official-receipt"
      data-print="area"
      lang={locale}
      className={cn(
        "mx-auto box-border w-[80mm] max-w-[80mm] bg-white px-[3mm] py-[3mm] text-[11px] leading-snug text-foreground shadow-sm print:shadow-none",
        receiptFontClass(locale),
        className,
      )}
      aria-label={`Receipt ${receipt.reference}`}
    >
      <header className="text-center">
        <img
          src={RECEIPT_LOGO_SRC}
          alt=""
          width={52}
          height={52}
          className="mx-auto h-[13mm] w-[13mm] object-contain"
        />
        <h2 className="mt-1 font-display text-[13px] font-bold uppercase leading-tight tracking-tight text-primary">
          {church.name}
        </h2>
        <p className="mt-0.5 text-[10px] leading-snug text-foreground/80">{locality}</p>
        {church.phone ? <p className="text-[10px] text-foreground/80">{church.phone}</p> : null}
      </header>

      <Rule />

      <div className="text-center">
        <Caption latin={latin} wide>
          {t.officialReceipt}
        </Caption>
        <p className="mt-0.5 font-display text-[13px] font-bold tabular-nums">{receipt.reference}</p>
        <p className="mt-0.5 text-[10px] text-foreground/70">
          {localizeDate(receipt.issuedAt, locale)}
        </p>
      </div>

      <Rule />

      <Caption latin={latin}>{t.prayerIntention}</Caption>
      <p className="mt-0.5 font-semibold">{prayerTypeName}</p>

      <Caption latin={latin} className="mt-2">
        {t.receivedFrom}
      </Caption>
      <Row label={t.name} value={customerName} />
      {customer.mobile ? <Row label={t.mobile} value={customer.mobile} /> : null}

      <Caption latin={latin} className="mt-2">
        {t.prayerFor}
      </Caption>
      <p className="font-semibold">{localizeText(intention.prayerFor, locale)}</p>

      <Caption latin={latin} className="mt-2">
        {t.prayerDate}
      </Caption>
      <p>{localizeDate(intention.prayerDate, locale)}</p>

      {showRequestedBy ? (
        <>
          <Caption latin={latin} className="mt-2">
            {t.requestedBy}
          </Caption>
          <p>{localizeName(requestedBy ?? "", locale)}</p>
        </>
      ) : null}

      <Rule />

      <Caption latin={latin}>{t.payment}</Caption>
      <Row label={t.method} value={methodText} />
      <Row label={t.description} value={prayerTypeName} />

      <Rule />

      <Caption latin={latin}>{t.totalReceived}</Caption>
      <p className="text-right font-display text-[18px] font-bold tabular-nums text-primary">
        {formatCurrency(payment.amount)}
      </p>

      <Rule />

      <p className="text-[10px]">
        {t.status}:{" "}
        <span
          className={cn(
            "font-semibold",
            payment.status === "VERIFIED" && "text-success",
            payment.status === "PENDING_VERIFICATION" && "text-warning",
            payment.status === "REJECTED" && "text-destructive",
          )}
        >
          {statusText}
        </span>
      </p>
      <p className="mt-1 text-[10px]">
        {t.receivedBy}: {localizeName(receipt.receivedBy?.name ?? "", locale) || t.parishOffice}
      </p>

      {/* The closing line is broken by hand in every language — left to wrap,
          it splits at whatever point the width happens to fall on. */}
      <p className="mt-3 whitespace-pre-line text-center font-display text-[11px] font-semibold text-primary">
        {t.thanks}
      </p>

      <Rule />

      <p
        className={cn(
          "text-center text-[10px] font-semibold text-foreground/70",
          latin && "uppercase tracking-[0.08em]",
        )}
      >
        {church.name}
      </p>
    </article>
  );
}

function Rule() {
  return <hr className="my-2 border-0 border-t border-foreground/70" />;
}

/**
 * Section heading. Uppercasing and letter-spacing are Latin typography — an
 * Indic script has no case, and spacing the letters out pulls conjuncts and
 * vowel signs away from the consonant they belong to.
 */
function Caption({
  children,
  latin,
  wide,
  className,
}: {
  children: React.ReactNode;
  latin: boolean;
  /** The document title sits one notch wider than the section headings. */
  wide?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[9px] font-semibold text-foreground/70",
        latin && (wide ? "uppercase tracking-[0.14em]" : "uppercase tracking-[0.12em]"),
        className,
      )}
    >
      {children}
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-foreground/70">{label}</span>
      <span className="min-w-0 text-right font-medium [overflow-wrap:anywhere]">{value}</span>
    </div>
  );
}
