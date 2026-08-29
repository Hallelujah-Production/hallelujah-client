import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Banknote, CheckCircle2, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, DetailList, DetailRow } from "@/components/ui/card";
import { MethodBadge, PaymentStatusBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ImagePreview } from "@/components/ui/image-preview";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getPaymentById } from "@/lib/services";
import { formatCurrency, formatDateTime, formatFileSize, formatLongDate } from "@/lib/utils";
import { VerificationActions } from "./verification-actions";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, payment] = await Promise.all([getSession(), getPaymentById("", id)]);
  const admin = assertChurchAdmin(session);
  if (!payment) notFound();

  const isCash = payment.method === "CASH";

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Payments", href: "/payments" },
          { label: payment.intention?.reference ?? "Payment" },
        ]}
        eyebrow="Payment record"
        title={formatCurrency(payment.amount)}
        description={`${payment.customer.name} · ${payment.prayerType?.name} · recorded ${formatDateTime(payment.createdAt)}`}
        actions={
          <>
            <ButtonLink href={`/intentions/${payment.intentionId}`} variant="outline" size="sm">
              Open intention
            </ButtonLink>
            {payment.intention?.receiptId ? (
              <ButtonLink href={`/receipts/${payment.intention.receiptId}`} variant="outline" size="sm">
                <FileText className="h-4 w-4" aria-hidden="true" />
                View receipt
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {payment.status === "PENDING_VERIFICATION" ? (
        <p className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning-muted px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            This offering is waiting for your verification. Check it against your counter
            register or bank statement, then verify or reject it.
          </span>
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment details</CardTitle>
              <PaymentStatusBadge status={payment.status} />
            </CardHeader>
            <CardContent className="pt-1">
              <DetailList>
                <DetailRow label="Amount">
                  <span className="font-display text-lg font-semibold tabular-nums">
                    {formatCurrency(payment.amount)}
                  </span>
                </DetailRow>
                <DetailRow label="Method">
                  <MethodBadge method={payment.method} />
                </DetailRow>
                <DetailRow label="Provider">
                  {payment.provider ?? <span className="text-muted-foreground">—</span>}
                </DetailRow>
                <DetailRow label="Transaction / reference ID">
                  {payment.transactionId ? (
                    <span className="tabular-nums">{payment.transactionId}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {isCash
                        ? "Not required for a cash offering"
                        : "Not provided"}
                    </span>
                  )}
                </DetailRow>
                <DetailRow label="Recorded at">{formatDateTime(payment.createdAt)}</DetailRow>
                {payment.notes ? (
                  <DetailRow label="Notes">{payment.notes}</DetailRow>
                ) : null}
              </DetailList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment proof</CardTitle>
              {payment.proof ? <ImagePreview proof={payment.proof} src={payment.proof.previewUrl} /> : null}
            </CardHeader>
            <CardContent>
              {payment.proof ? (
                <div className="flex flex-wrap items-center gap-4">
                  {payment.proof.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- private proof bytes, not a static asset
                    <img
                      src={payment.proof.previewUrl}
                      alt={`Payment proof ${payment.proof.fileName}`}
                      className="h-24 w-24 rounded-md border border-border object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted text-2xl"
                    >
                      🧾
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {payment.proof.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(payment.proof.sizeBytes)} ·{" "}
                      {payment.proof.mimeType.replace("image/", "").toUpperCase()} · uploaded{" "}
                      {formatDateTime(payment.proof.uploadedAt)}
                    </p>
                    <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                      Proof images are held in private storage scoped to your church and
                      served through short-lived links. They are never publicly addressable.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-md border border-dashed border-border bg-muted/40 px-4 py-4">
                  <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {isCash
                      ? "No proof was attached. Cash offerings are verified against the counter register for the day."
                      : "No proof was attached. Verify this payment against your bank or UPI statement using the transaction reference."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification history</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <DetailList>
                <DetailRow label="Current status">
                  <PaymentStatusBadge status={payment.status} />
                </DetailRow>
                {payment.status === "VERIFIED" ? (
                  <>
                    <DetailRow label="Verified by">
                      {payment.verifiedBy?.name ?? "—"}
                    </DetailRow>
                    <DetailRow label="Verified at">
                      {formatDateTime(payment.verifiedAt)}
                    </DetailRow>
                  </>
                ) : null}
                {payment.status === "REJECTED" ? (
                  <>
                    <DetailRow label="Rejected by">
                      {payment.rejectedBy?.name ?? "—"}
                    </DetailRow>
                    <DetailRow label="Rejected at">
                      {formatDateTime(payment.rejectedAt)}
                    </DetailRow>
                    <DetailRow label="Reason">
                      {payment.rejectionReason ?? "—"}
                    </DetailRow>
                  </>
                ) : null}
                {payment.status === "PENDING_VERIFICATION" ? (
                  <DetailRow label="Awaiting">
                    <span className="text-muted-foreground">
                      Confirmation by a church administrator
                    </span>
                  </DetailRow>
                ) : null}
              </DetailList>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <VerificationActions
                paymentId={payment.id}
                status={payment.status}
                amount={payment.amount}
                method={payment.method}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family</CardTitle>
              <Link
                href={`/customers/${payment.customer.id}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                View profile
              </Link>
            </CardHeader>
            <CardContent className="pt-1">
              <DetailList>
                <DetailRow label="Name">{payment.customer.name}</DetailRow>
                <DetailRow label="Mobile">
                  <span className="tabular-nums">{payment.customer.mobile ?? "—"}</span>
                </DetailRow>
                <DetailRow label="Email">
                  {payment.customer.email ?? <span className="text-muted-foreground">—</span>}
                </DetailRow>
              </DetailList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intention</CardTitle>
              <Link
                href={`/intentions/${payment.intentionId}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open
              </Link>
            </CardHeader>
            <CardContent className="pt-1">
              <DetailList>
                <DetailRow label="Receipt reference">
                  <span className="tabular-nums">{payment.intention?.reference}</span>
                </DetailRow>
                <DetailRow label="Prayer type">{payment.prayerType?.name}</DetailRow>
                <DetailRow label="Prayer for">{payment.intention?.prayerFor}</DetailRow>
                <DetailRow label="Prayer date">
                  {formatLongDate(payment.intention?.prayerDate)}
                </DetailRow>
                <DetailRow label="Intention status">
                  {payment.intention ? <StatusBadge status={payment.intention.status} /> : "—"}
                </DetailRow>
              </DetailList>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-secondary/20 bg-secondary-muted/50 p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-secondary" aria-hidden="true" />
              Offline payment
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              This offering was paid straight to {admin.currentChurch.name}. Hallelujah holds
              only the record of it — there is no gateway, no settlement and no refund flow
              in this platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
