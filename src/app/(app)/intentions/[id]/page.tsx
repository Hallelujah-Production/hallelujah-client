import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, Printer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LiveRefresh } from "@/components/data/live-refresh";
import { Card, CardContent, CardHeader, CardTitle, DetailList, DetailRow } from "@/components/ui/card";
import { MethodBadge, PaymentStatusBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ImagePreview } from "@/components/ui/image-preview";
import { PrayerElapsedTimer } from "@/components/domain/prayer-elapsed-timer";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getAssignableStaff, getIntentionById } from "@/lib/services";
import {
  formatCurrency,
  formatDateTime,
  formatFileSize,
  formatLongDate,
  formatPrayerDuration,
  formatTime,
  prayerTypeNames,} from "@/lib/utils";
import { IntentionActions } from "./intention-actions";
import { IntentionRowActions } from "../intention-row-actions";

export const metadata: Metadata = {
  title: "Prayer intention",
  robots: { index: false, follow: false },
};

export default async function IntentionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const [session, intention, allStaff] = await Promise.all([
    getSession(),
    getIntentionById("", id),
    getAssignableStaff(),
  ]);
  assertChurchAdmin(session);

  if (!intention) notFound();

  const staff = allStaff.filter((member) => member.churchId === intention.churchId);

  const justCreated = query.created === "1";
  const { payment, customer, prayerType } = intention;

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Intentions", href: "/intentions" },
          { label: intention.reference },
        ]}
        eyebrow={prayerTypeNames(intention)}
        title={intention.prayerFor}
        description={`Requested by ${intention.requestedBy} · ${formatLongDate(intention.prayerDate)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <IntentionRowActions
              intentionId={intention.id}
              reference={intention.reference}
              status={intention.status}
              paymentStatus={payment.status}
              compact={false}
              showView={false}
            />
            {intention.receiptId ? (
              <>
                <ButtonLink href={`/receipts/${intention.receiptId}`} variant="outline" size="sm">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  View receipt
                </ButtonLink>
                <ButtonLink href={`/receipts/${intention.receiptId}?print=1`} variant="outline" size="sm">
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  Print receipt
                </ButtonLink>
              </>
            ) : null}
          </div>
        }
      />

      {justCreated ? (
        <p className="flex items-start gap-2 rounded-lg border border-success/25 bg-success-muted px-4 py-3 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Intention recorded as{" "}
            <strong className="font-semibold">{intention.reference}</strong>.
            {intention.assignedStaff?.name
              ? ` Allotted to ${intention.assignedStaff.name} — they will see it under My Prayers.`
              : " Allot it to prayer staff on the right so it appears on their dashboard."}{" "}
            Confirm the offering on Payments if you want to issue an official receipt.
          </span>
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        {/* Prayer ticket */}
        <div className="space-y-6">
          <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-primary px-6 py-5 text-primary-foreground">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-foreground/10"
                >
                  <PrayerIcon icon={prayerType.icon} size="sm" className="bg-transparent text-accent" />
                </span>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent">
                    Prayer intention
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                    {prayerTypeNames(intention)}
                  </h2>
                </div>
              </div>
              <p className="font-display text-sm font-semibold tabular-nums text-primary-foreground/80">
                {intention.reference}
              </p>
            </div>

            <div className="grid gap-x-8 gap-y-1 px-6 py-5 sm:grid-cols-2">
              <TicketField label="For" value={intention.prayerFor} large />
              <TicketField label="Requested by" value={intention.requestedBy} large />
              <TicketField label="Prayer date" value={formatLongDate(intention.prayerDate)} />
              <TicketField label="Preferred time" value={formatTime(intention.preferredTime)} />
            </div>

            {intention.message ? (
              <div className="border-t border-border px-6 py-5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Message
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  {intention.message}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/40 px-6 py-4">
              <StatusBadge status={intention.status} />
              <PaymentStatusBadge status={payment.status} />
              <span className="ml-auto font-display text-lg font-semibold tabular-nums text-foreground">
                {formatCurrency(intention.amount)}
              </span>
            </div>
          </article>

          {intention.status === "IN_PROGRESS" ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
              <h2 className="font-display text-base font-semibold text-foreground">
                Prayer being offered
              </h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Offering time</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {intention.startedAt ? (
                      <PrayerElapsedTimer startedAt={intention.startedAt} />
                    ) : (
                      "Not timed"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Started at</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {formatDateTime(intention.startedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Offered by</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {intention.assignedStaff?.name ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {intention.status === "COMPLETED" ? (
            <div className="rounded-lg border border-success/25 bg-success-muted p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                Prayer completed
              </h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Time offered</dt>
                  <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
                    {formatPrayerDuration(intention.startedAt, intention.completedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Started at</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {formatDateTime(intention.startedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Completed at</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {formatDateTime(intention.completedAt)}
                  </dd>
                </div>
                <div className="sm:col-span-3">
                  <dt className="text-xs text-muted-foreground">Completed by</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {intention.assignedStaff?.name ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {intention.status === "CANCELLED" ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive-muted p-5">
              <h2 className="font-display text-base font-semibold text-foreground">
                Intention cancelled
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {intention.cancellationReason} · {formatDateTime(intention.cancelledAt)}
              </p>
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Payment record</CardTitle>
              <Link
                href={`/payments/${payment.id}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open payment
              </Link>
            </CardHeader>
            <CardContent className="pt-1">
              <DetailList>
                <DetailRow label="Amount">{formatCurrency(payment.amount)}</DetailRow>
                <DetailRow label="Method">
                  <MethodBadge method={payment.method} />
                </DetailRow>
                {payment.provider ? (
                  <DetailRow label="Provider">{payment.provider}</DetailRow>
                ) : null}
                <DetailRow label="Transaction ID">
                  {payment.transactionId ?? (
                    <span className="text-muted-foreground">
                      Not required for a cash offering
                    </span>
                  )}
                </DetailRow>
                <DetailRow label="Payment status">
                  <span className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={payment.status} />
                    {payment.verifiedAt ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        {formatDateTime(payment.verifiedAt)}
                      </span>
                    ) : null}
                  </span>
                </DetailRow>
                <DetailRow label="Payment proof">
                  {payment.proof ? (
                    <div className="space-y-3">
                      {payment.proof.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- private proof bytes, not a static asset
                        <img
                          src={payment.proof.previewUrl}
                          alt={`Payment proof ${payment.proof.fileName}`}
                          className="max-h-64 w-auto rounded-md border border-border object-contain"
                        />
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {payment.proof.fileName}
                        {payment.proof.sizeBytes
                          ? ` · ${formatFileSize(payment.proof.sizeBytes)}`
                          : ""}
                      </p>
                      <ImagePreview proof={payment.proof} src={payment.proof.previewUrl} />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No proof attached</span>
                  )}
                </DetailRow>
                <DetailRow label="Receipt">
                  {intention.receiptId ? (
                    <Link
                      href={`/receipts/${intention.receiptId}`}
                      className="tabular-nums text-primary underline-offset-4 hover:underline"
                    >
                      View receipt
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">
                      Issued after the offering is verified
                    </span>
                  )}
                </DetailRow>
              </DetailList>
            </CardContent>
          </Card>
        </div>

        {/* Side rail */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <IntentionActions
                intentionId={intention.id}
                status={intention.status}
                staff={staff}
                assignedStaffId={intention.assignment?.staffUserId}
                paymentVerified={payment.status === "VERIFIED"}
                promptAssign={justCreated && !intention.assignment?.staffUserId}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family</CardTitle>
              <Link
                href={`/customers/${customer.id}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                View profile
              </Link>
            </CardHeader>
            <CardContent className="pt-1">
              <DetailList>
                <DetailRow label="Name">{customer.name}</DetailRow>
                <DetailRow label="Mobile">
                  {customer.mobile ? (
                    <a href={`tel:${customer.mobile}`} className="tabular-nums hover:underline">
                      {customer.mobile}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </DetailRow>
                <DetailRow label="Email">
                  {customer.email ?? <span className="text-muted-foreground">Not provided</span>}
                </DetailRow>
                <DetailRow label="Address">
                  {customer.addressLine ? (
                    `${customer.addressLine}${customer.city ? `, ${customer.city}` : ""}`
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </DetailRow>
              </DetailList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <DetailList>
                <DetailRow label="Assigned staff">
                  {intention.assignedStaff?.name ?? (
                    <span className="text-muted-foreground">Not assigned yet</span>
                  )}
                </DetailRow>
                <DetailRow label="Assigned at">
                  {intention.assignment
                    ? formatDateTime(intention.assignment.assignedAt)
                    : "—"}
                </DetailRow>
                <DetailRow label="Intention status">
                  <StatusBadge status={intention.status} />
                </DetailRow>
                <DetailRow label="Recorded">
                  {formatDateTime(intention.createdAt)} ·{" "}
                  {intention.source === "PUBLIC" ? "Submitted online" : "Taken at the parish"}
                </DetailRow>
              </DetailList>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TicketField({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="py-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          large
            ? "mt-1 font-display text-lg font-semibold tracking-tight text-foreground"
            : "mt-1 text-sm font-medium text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}
