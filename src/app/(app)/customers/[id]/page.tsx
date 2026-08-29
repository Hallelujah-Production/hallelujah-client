import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, DetailList, DetailRow } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import { MethodBadge, PaymentStatusBadge, StatusBadge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data/data-table";
import { EmptyState } from "@/components/ui/states";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import {
  getCustomerById,
  getCustomerIntentions,
  getCustomerPayments,
  getCustomerReceipts,
} from "@/lib/services";
import type { IntentionView, PaymentView, ReceiptView } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Family",
  robots: { index: false, follow: false },
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, customer, intentions, payments, receipts] = await Promise.all([
    getSession(),
    getCustomerById("", id),
    getCustomerIntentions("", id),
    getCustomerPayments("", id),
    getCustomerReceipts("", id),
  ]);
  const admin = assertChurchAdmin(session);
  if (!customer) notFound();

  const intentionColumns: Column<IntentionView>[] = [
    { key: "reference", header: "Receipt", cell: (r) => <span className="tabular-nums">{r.reference}</span> },
    { key: "type", header: "Prayer type", cell: (r) => r.prayerType.name },
    { key: "for", header: "Prayer for", cell: (r) => r.prayerFor, hideBelow: "lg" },
    { key: "date", header: "Prayer date", cell: (r) => formatDate(r.prayerDate) },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (r) => <span className="tabular-nums">{formatCurrency(r.amount)}</span>,
    },
    { key: "status", header: "Status", align: "right", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const paymentColumns: Column<PaymentView>[] = [
    { key: "date", header: "Date", cell: (r) => formatDate(r.createdAt) },
    { key: "method", header: "Method", cell: (r) => <MethodBadge method={r.method} /> },
    {
      key: "reference",
      header: "Transaction ID",
      hideBelow: "lg",
      cell: (r) => (
        <span className="text-xs tabular-nums">{r.transactionId ?? "Cash — no reference"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (r) => <span className="tabular-nums">{formatCurrency(r.amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (r) => <PaymentStatusBadge status={r.status} short />,
    },
  ];

  const receiptColumns: Column<ReceiptView>[] = [
    { key: "reference", header: "Receipt", cell: (r) => <span className="tabular-nums">{r.reference}</span> },
    { key: "issued", header: "Issued", cell: (r) => formatDateTime(r.issuedAt) },
    { key: "prayer", header: "Prayer", cell: (r) => r.prayerType.name, hideBelow: "lg" },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (r) => <span className="tabular-nums">{formatCurrency(r.payment.amount)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (r) => (
        <Link href={`/receipts/${r.id}`} className="text-sm font-medium text-primary hover:underline">
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Families", href: "/customers" },
          { label: customer.name },
        ]}
        title={customer.name}
        description={`With ${admin.currentChurch.name} since ${formatDate(customer.createdAt)}`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem] xl:items-start">
        <div className="space-y-6">
          <StatGrid columns={3}>
            <StatCard label="Total intentions" value={customer.totalIntentions} emphasis />
            <StatCard
              label="Total paid"
              value={formatCurrency(customer.totalPaid)}
              hint="Verified offerings only"
              tone="accent"
              emphasis
            />
            <StatCard
              label="Last prayer"
              value={customer.lastPrayerDate ? formatDate(customer.lastPrayerDate) : "—"}
              emphasis
            />
          </StatGrid>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Prayer history
            </h2>
            {intentions.length ? (
              <DataTable
                columns={intentionColumns}
                rows={intentions}
                caption={`Prayer history for ${customer.name}`}
                rowHref={(row) => `/intentions/${row.id}`}
              />
            ) : (
              <EmptyState title="No intentions recorded for this customer yet." />
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Payment history
            </h2>
            {payments.length ? (
              <DataTable
                columns={paymentColumns}
                rows={payments}
                caption={`Payment history for ${customer.name}`}
                rowHref={(row) => `/payments/${row.id}`}
              />
            ) : (
              <EmptyState title="No payments recorded for this customer yet." />
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Receipts
            </h2>
            {receipts.length ? (
              <DataTable
                columns={receiptColumns}
                rows={receipts}
                caption={`Receipts issued to ${customer.name}`}
                rowHref={(row) => `/receipts/${row.id}`}
              />
            ) : (
              <EmptyState title="No receipts issued yet." />
            )}
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {initials(customer.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-foreground">
                    {customer.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Added {formatDate(customer.createdAt)}
                  </p>
                </div>
              </div>

              <ul className="space-y-3 border-t border-border pt-4 text-sm">
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <a href={`tel:${customer.mobile}`} className="tabular-nums text-foreground hover:underline">
                    {customer.mobile}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="break-all text-foreground hover:underline">
                      {customer.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="text-foreground">
                    {customer.addressLine
                      ? `${customer.addressLine}${customer.city ? `, ${customer.city}` : ""}`
                      : "Not provided"}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {customer.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Office notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{customer.notes}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <DetailList>
                <DetailRow label="Intentions">{customer.totalIntentions}</DetailRow>
                <DetailRow label="Receipts issued">{receipts.length}</DetailRow>
                <DetailRow label="Payments recorded">{payments.length}</DetailRow>
                <DetailRow label="Verified total">{formatCurrency(customer.totalPaid)}</DetailRow>
              </DetailList>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
