import { PAYMENT_METHOD_LABEL, type ReceiptView } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

/** Print-receipt crest only. Do not use on the app chrome or public site. */
const RECEIPT_LOGO_SRC = "/brand/receipt-logo.jpeg";

/** Standard 80mm thermal / POS roll. Height follows content — never a fixed page. */
export const THERMAL_WIDTH_MM = 80;

const PAYMENT_STATUS_TEXT = {
  PENDING_VERIFICATION: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

/**
 * Compact 80mm thermal receipt. Screen preview is the same width as the roll.
 */
export function Receipt({
  receipt,
  className,
}: {
  receipt: ReceiptView;
  className?: string;
}) {
  const { church, customer, intention, prayerType, payment } = receipt;
  const locality = [church.addressLine1, church.city].filter(Boolean).join(", ");
  const requestedBy = intention.requestedBy?.trim();
  const showRequestedBy =
    Boolean(requestedBy) &&
    requestedBy.toLowerCase() !== customer.name.trim().toLowerCase() &&
    requestedBy.toLowerCase() !== (receipt.receivedBy?.name ?? "").trim().toLowerCase();

  return (
    <article
      id="official-receipt"
      data-print="area"
      className={cn(
        "mx-auto box-border w-[80mm] max-w-[80mm] bg-white px-[3mm] py-[3mm] text-[11px] leading-snug text-foreground shadow-sm print:shadow-none",
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
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Official receipt
        </p>
        <p className="mt-0.5 font-display text-[13px] font-bold tabular-nums">{receipt.reference}</p>
        <p className="mt-0.5 text-[10px] text-foreground/70">{formatDate(receipt.issuedAt)}</p>
      </div>

      <Rule />

      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
        Prayer intention
      </p>
      <p className="mt-0.5 font-semibold">{prayerType.name}</p>

      <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
        Received from
      </p>
      <Row label="Name" value={customer.name} />
      {customer.mobile ? <Row label="Mobile" value={customer.mobile} /> : null}

      <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
        Prayer for
      </p>
      <p className="font-semibold">{intention.prayerFor}</p>

      <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
        Prayer date
      </p>
      <p>{formatDate(intention.prayerDate)}</p>

      {showRequestedBy ? (
        <>
          <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
            Requested by
          </p>
          <p>{requestedBy}</p>
        </>
      ) : null}

      <Rule />

      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
        Payment
      </p>
      <Row label="Method" value={PAYMENT_METHOD_LABEL[payment.method]} />
      <Row label="Description" value={prayerType.name} />

      <Rule />

      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
        Total received
      </p>
      <p className="text-right font-display text-[18px] font-bold tabular-nums text-primary">
        {formatCurrency(payment.amount)}
      </p>

      <Rule />

      <p className="text-[10px]">
        Status:{" "}
        <span
          className={cn(
            "font-semibold",
            payment.status === "VERIFIED" && "text-success",
            payment.status === "PENDING_VERIFICATION" && "text-warning",
            payment.status === "REJECTED" && "text-destructive",
          )}
        >
          {PAYMENT_STATUS_TEXT[payment.status]}
        </span>
      </p>
      <p className="mt-1 text-[10px]">
        Received By: {receipt.receivedBy?.name ?? "Parish office"}
      </p>

      <p className="mt-3 text-center font-display text-[11px] font-semibold text-primary">
        Thank you for your
        <br />
        prayer intention!
      </p>

      <Rule />

      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/70">
        {church.name}
      </p>
    </article>
  );
}

function Rule() {
  return <hr className="my-2 border-0 border-t border-foreground/70" />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-foreground/70">{label}</span>
      <span className="min-w-0 text-right font-medium [overflow-wrap:anywhere]">{value}</span>
    </div>
  );
}
