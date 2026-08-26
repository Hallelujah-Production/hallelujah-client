import { BrandMark } from "@/components/layout/church-mark";
import { PAYMENT_METHOD_LABEL, type ReceiptView } from "@/lib/types";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatLongDate,
} from "@/lib/utils";

const PAYMENT_STATUS_TEXT = {
  PENDING_VERIFICATION: "⚠ Pending verification",
  VERIFIED: "✓ Verified",
  REJECTED: "✕ Rejected",
} as const;

/** ISO 216 A4 portrait — screen preview and print share this sheet. */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/**
 * The official church receipt.
 *
 * This is the one screen that leaves the building: it is printed and handed to
 * a family. The sheet is locked to A4 (210mm × 297mm) so on-screen and paper
 * match; the print stylesheet strips the application around it.
 */
export function Receipt({
  receipt,
  className,
}: {
  receipt: ReceiptView;
  className?: string;
}) {
  const { church, customer, intention, prayerType, payment } = receipt;

  return (
    <article
      id="official-receipt"
      data-print="area"
      className={cn(
        "mx-auto box-border flex w-full flex-col border border-border bg-white p-[12mm] text-[0.9rem] text-foreground shadow-sm print:border-0 print:shadow-none",
        className,
      )}
      style={{
        width: `${A4_WIDTH_MM}mm`,
        maxWidth: `${A4_WIDTH_MM}mm`,
        minHeight: `${A4_HEIGHT_MM}mm`,
      }}
      aria-label={`Receipt ${receipt.reference}`}
    >
      {/* Church header */}
      <header className="flex flex-nowrap items-start justify-between gap-6 border-b-2 border-primary pb-6">
        <div className="flex min-w-0 flex-1 flex-nowrap items-start gap-4">
          <BrandMark
            showName={false}
            size="lg"
            className="shrink-0 print:opacity-100"
          />
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight text-primary [text-wrap:wrap]">
              {church.name}
            </h2>
            <address className="mt-1.5 text-xs not-italic leading-relaxed text-muted-foreground [overflow-wrap:normal] [word-break:normal]">
              {church.addressLine1}
              {church.addressLine2 ? <>, {church.addressLine2}</> : null}
              <br />
              {church.city}, {church.state} {church.postalCode}
              <br />
              {church.phone} · {church.email}
            </address>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent">
            Official receipt
          </p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
            {receipt.reference}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Issued {formatDate(receipt.issuedAt)}
          </p>
        </div>
      </header>

      <p className="mt-6 text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Prayer intention offering
      </p>

      {/* Customer + prayer */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <Block title="Received from">
          <Line label="Name" value={customer.name} strong />
          <Line label="Mobile" value={customer.mobile} />
          {customer.email ? <Line label="Email" value={customer.email} /> : null}
          {customer.addressLine ? (
            <Line label="Address" value={`${customer.addressLine}${customer.city ? `, ${customer.city}` : ""}`} />
          ) : null}
        </Block>

        <Block title="Prayer details">
          <Line label="Prayer type" value={prayerType.name} strong />
          <Line label="Offered for" value={intention.prayerFor} />
          <Line label="Prayer date" value={formatLongDate(intention.prayerDate)} />
          <Line label="Requested by" value={intention.requestedBy} />
        </Block>
      </div>

      {intention.message ? (
        <div className="mt-5 rounded border border-dashed border-border bg-muted/40 px-4 py-3 print:bg-transparent">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Intention
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{intention.message}</p>
        </div>
      ) : null}

      {/* Payment */}
      <div className="mt-6 overflow-visible rounded border border-border">
        <table className="w-full table-fixed border-collapse text-sm">
          <caption className="sr-only">Payment recorded for this intention</caption>
          <thead>
            <tr className="border-b border-border bg-muted/60 print:bg-transparent">
              <th scope="col" className="w-[40%] px-4 py-2.5 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Description
              </th>
              <th scope="col" className="w-[20%] px-4 py-2.5 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Method
              </th>
              <th scope="col" className="w-[22%] px-4 py-2.5 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Reference
              </th>
              <th scope="col" className="w-[18%] px-4 py-2.5 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-3 align-top">
                <span className="font-medium text-foreground">{prayerType.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  For {intention.prayerFor} · {formatDate(intention.prayerDate)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-top text-foreground">
                {PAYMENT_METHOD_LABEL[payment.method]}
                {payment.provider ? (
                  <span className="block text-xs text-muted-foreground">{payment.provider}</span>
                ) : null}
              </td>
              <td className="px-4 py-3 align-top text-xs text-foreground [overflow-wrap:normal] [word-break:normal]">
                {payment.transactionId ?? (payment.method === "CASH" ? "Cash — no reference" : "—")}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                {formatCurrency(payment.amount)}
              </td>
            </tr>
            <tr className="bg-muted/40 print:bg-transparent">
              <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Total received
              </td>
              <td className="px-4 py-3 text-right font-display text-lg font-bold tabular-nums text-primary">
                {formatCurrency(payment.amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <p className="text-muted-foreground">
          Payment status:{" "}
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
          {payment.verifiedAt ? (
            <span className="text-muted-foreground"> on {formatDateTime(payment.verifiedAt)}</span>
          ) : null}
        </p>
        <p className="text-right text-muted-foreground">
          This offering was paid directly to the church. No online payment gateway was used.
        </p>
      </div>

      <div className="mt-auto pt-10">
      {/* Authorisation */}
      <div className="grid grid-cols-2 gap-8">
        <Signature label="Received by" name={receipt.receivedBy?.name ?? "Parish office"} />
        <Signature
          label="Authorised by"
          name={receipt.authorizedBy?.name ?? "Pending verification"}
          muted={!receipt.authorizedBy}
        />
      </div>

      <footer className="mt-10 border-t border-border pt-5 text-center">
        <p className="font-display text-sm font-semibold text-primary">
          Thank you for your prayer intention.
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          May God bless you and your family.
        </p>
        <div className="mt-5 flex flex-nowrap justify-center">
          <BrandMark size="sm" className="flex-nowrap" />
        </div>
        <p className="mt-3 text-[0.65rem] text-muted-foreground">
          {church.name} · Receipt {receipt.reference} · Issued through Hallelujah · This is
          a computer-generated receipt issued by the parish office.
        </p>
      </footer>
      </div>
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="border-b border-border pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      <dl className="mt-2.5 space-y-1.5">{children}</dl>
    </section>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-nowrap gap-3 text-sm">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 flex-1 [overflow-wrap:normal] [word-break:normal]",
          strong ? "font-semibold text-foreground" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Signature({ label, name, muted }: { label: string; name: string; muted?: boolean }) {
  return (
    <div>
      <div className="h-12" aria-hidden="true" />
      <div className="border-t border-foreground/40 pt-1.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className={cn("text-sm", muted ? "text-muted-foreground" : "font-medium text-foreground")}>
          {name}
        </p>
      </div>
    </div>
  );
}
