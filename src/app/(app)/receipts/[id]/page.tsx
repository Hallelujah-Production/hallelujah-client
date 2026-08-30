import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Receipt } from "@/components/domain/receipt";
import { PrintButton } from "@/components/domain/print-button";
import { AutoPrint } from "@/components/domain/auto-print";
import { ThermalPrintDocument } from "@/components/domain/thermal-print-document";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getReceipt } from "@/lib/services";

export const metadata: Metadata = {
  title: "Receipt",
  robots: { index: false, follow: false },
};

export default async function ReceiptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const [session, receipt] = await Promise.all([getSession(), getReceipt("", id)]);
  assertChurchAdmin(session);
  if (!receipt) notFound();

  return (
    <div className="space-y-6 print:space-y-0">
      <ThermalPrintDocument />
      <AutoPrint enabled={query.print === "1"} />

      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Receipts", href: "/receipts" },
          { label: receipt.reference },
        ]}
        eyebrow="Official receipt"
        title={receipt.reference}
        description={`Issued to ${receipt.customer.name} for ${receipt.prayerType.name}.`}
        actions={
          <>
            <ButtonLink href="#official-receipt" variant="outline" size="sm">
              View Receipt
            </ButtonLink>
            <ButtonLink
              href={`/intentions/${receipt.intentionId}`}
              variant="outline"
              size="sm"
            >
              Open intention
            </ButtonLink>
            <PrintButton size="sm" label="Print Receipt" />
          </>
        }
      />

      {receipt.payment.status !== "VERIFIED" ? (
        <p
          data-print="hide"
          className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning-muted px-4 py-3 text-sm text-warning"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            This receipt is not yet authorised — the offering has not been verified. It can
            still be printed, and it will show the payment as pending until you verify it.
          </span>
        </p>
      ) : null}

      <div className="print:mx-0 print:overflow-visible print:px-0 print:pb-0">
        <Receipt receipt={receipt} />
      </div>

      <p data-print="hide" className="text-center text-xs text-muted-foreground">
        Printing hides the navigation and every control — only the 80mm thermal
        receipt above reaches the paper. Printer: 80mm thermal / POS, margins None.
      </p>
    </div>
  );
}
