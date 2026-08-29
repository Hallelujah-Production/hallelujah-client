import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader, TabNav } from "@/components/layout/page-header";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import { Card, CardContent, CardHeader, CardTitle, DetailList, DetailRow } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data/data-table";
import { Badge, MethodBadge, PaymentStatusBadge, StatusBadge } from "@/components/ui/badge";
import { ChurchMark } from "@/components/layout/church-mark";
import { ReportView } from "@/components/domain/report-view";
import { EmptyState } from "@/components/ui/states";
import { assertSuperAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import {
  getChurchAdmins,
  getChurchBySlugForPlatform,
  getChurchTeam,
  getChurchView,
  getIntentions,
  getPayments,
  getReport,
  getUsers,
  resolveRange,
} from "@/lib/services";
import type { IntentionView, PaymentView, UserView } from "@/lib/types";
import { first, formatCompactCurrency, formatCurrency, formatDate } from "@/lib/utils";
import { ChurchDeleteButton } from "../church-delete-button";
import { ChurchStatusToggle } from "../church-status-toggle";
import { ChurchAdminAssignmentManager, UnassignAdminButton } from "../church-admin-assignments";
import { TeamManager } from "@/app/(app)/team/team-manager";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const church = await getChurchBySlugForPlatform(slug);
  return {
    title: church ? church.name : "Church",
    robots: { index: false, follow: false },
  };
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "admin", label: "Admin" },
  { id: "team", label: "Team" },
  { id: "intentions", label: "Intentions" },
  { id: "payments", label: "Payments" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

export default async function PlatformChurchPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const section = first(query.section) ?? "overview";

  const [session, church] = await Promise.all([getSession(), getChurchBySlugForPlatform(slug)]);
  const admin = assertSuperAdmin(session);
  if (!church) notFound();

  const platform = { forPlatform: true as const };

  const viewPromise = section === "overview" ? getChurchView(church.id) : Promise.resolve(null);
  const teamPromise =
    section === "team" ? getChurchTeam(church.id, { limit: 60 }, platform) : Promise.resolve(null);
  const adminPromise =
    section === "admin"
      ? Promise.all([
          getChurchAdmins(church.id),
          getUsers({ role: "CHURCH_ADMIN", status: "ACTIVE", limit: 100 }),
        ])
      : Promise.resolve(null);

  const [view, team, adminBundle] = await Promise.all([viewPromise, teamPromise, adminPromise]);
  const assignedAdmins = adminBundle?.[0] ?? [];
  const allAdmins = adminBundle?.[1];

  const hrefFor = (id: string) =>
    id === "overview"
      ? `/super-admin/churches/${church.slug}`
      : `/super-admin/churches/${church.slug}?section=${id}`;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Platform", href: "/super-admin" },
          { label: "Churches", href: "/super-admin/churches" },
          { label: church.name },
        ]}
        eyebrow={`${church.city}, ${church.state}`}
        title={church.name}
        description={church.tagline}
        actions={
          <>
            {church.isActive ? (
              <Link
                href={`/church/${church.slug}`}
                className="inline-flex h-8 items-center gap-1.5 rounded border border-input bg-card px-3 text-[0.8125rem] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Public page
              </Link>
            ) : null}
            <ChurchStatusToggle
              churchId={church.id}
              churchName={church.name}
              isActive={church.isActive}
            />
            <ChurchDeleteButton
              churchId={church.id}
              churchName={church.name}
              redirectTo="/super-admin/churches"
            />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <ChurchMark initials={church.logoInitials} accent={church.accent} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-foreground">{church.name}</p>
          <p className="text-xs text-muted-foreground">
            /church/{church.slug} · established {church.establishedYear} · onboarded{" "}
            {formatDate(church.createdAt)}
          </p>
        </div>
        <Badge tone={church.isActive ? "success" : "neutral"}>
          <span aria-hidden="true">{church.isActive ? "✓" : "•"}</span>
          {church.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <TabNav
        items={SECTIONS.map((item) => ({
          label: item.label,
          href: hrefFor(item.id),
          active: section === item.id,
        }))}
      />

      {section === "overview" ? <Overview view={view} churchId={church.id} /> : null}
      {section === "admin" ? (
        <AdminSection
          churchId={church.id}
          churchName={church.name}
          assigned={assignedAdmins}
          candidates={allAdmins?.data ?? []}
        />
      ) : null}
      {section === "team" ? (
        <TeamSection
          members={team?.data ?? []}
          currentUserId={admin.currentUser.id}
          churchId={church.id}
        />
      ) : null}
      {section === "intentions" ? <IntentionsSection churchId={church.id} /> : null}
      {section === "payments" ? <PaymentsSection churchId={church.id} /> : null}
      {section === "reports" ? <ReportsSection churchId={church.id} /> : null}
      {section === "settings" ? <SettingsSection church={church} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function Overview({
  view,
  churchId,
}: {
  view: Awaited<ReturnType<typeof getChurchView>>;
  churchId: string;
}) {
  if (!view) return null;
  const [recent, pending] = await Promise.all([
    getIntentions(churchId, { limit: 5 }, { forPlatform: true }),
    getPayments(churchId, { status: "PENDING_VERIFICATION", limit: 1, countsOnly: true }, { forPlatform: true }),
  ]);

  return (
    <div className="space-y-6">
      <StatGrid columns={4}>
        <StatCard label="Intentions" value={view.intentionCount} emphasis />
        <StatCard
          label="Revenue"
          value={formatCompactCurrency(view.revenue)}
          hint="Verified offerings"
          tone="accent"
          emphasis
        />
        <StatCard label="Staff" value={view.staffCount} tone="secondary" emphasis />
        <StatCard
          label="Awaiting verification"
          value={pending.total}
          tone={pending.total > 0 ? "warning" : "default"}
          emphasis
        />
      </StatGrid>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Recent intentions
        </h2>
        {recent.data.length ? (
          <DataTable
            columns={intentionColumns}
            rows={recent.data}
            caption={`Recent intentions at ${view.name}`}
          />
        ) : (
          <EmptyState title="No intentions recorded yet." />
        )}
      </section>
    </div>
  );
}

function AdminSection({
  churchId,
  churchName,
  assigned,
  candidates,
}: {
  churchId: string;
  churchName: string;
  assigned: Awaited<ReturnType<typeof getChurchAdmins>>;
  candidates: UserView[];
}) {
  return (
    <div className="space-y-6">
      <ChurchAdminAssignmentManager
        churchId={churchId}
        assignedIds={assigned.map((a) => a.id)}
        candidates={candidates.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
      />

      {assigned.length === 0 ? (
        <EmptyState
          title="No administrator assigned."
          description={`${churchName} has no Church Admin. Assign an existing administrator or invite one when creating a user.`}
          action={{ label: "Create user", href: "/super-admin/users/new" }}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {assigned.map((admin) => (
            <li key={admin.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{admin.name}</CardTitle>
                  <Badge tone={admin.isActive ? "success" : "neutral"}>
                    {admin.invitationPending ? "Invited" : admin.isActive ? "Active" : "Deactivated"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <DetailList>
                    <DetailRow label="Email">{admin.email}</DetailRow>
                    <DetailRow label="Phone">{admin.phone || "Not provided"}</DetailRow>
                    <DetailRow label="Scope">
                      Assigned to {churchName}. They may also administer other parishes you have given them.
                    </DetailRow>
                  </DetailList>
                  <div className="mt-4">
                    <UnassignAdminButton churchId={churchId} userId={admin.id} name={admin.name} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamSection({
  members,
  currentUserId,
  churchId,
}: {
  members: UserView[];
  currentUserId: string;
  churchId: string;
}) {
  return (
    <TeamManager members={members} currentUserId={currentUserId} churchId={churchId} />
  );
}

const intentionColumns: Column<IntentionView>[] = [
  { key: "reference", header: "Receipt", cell: (r) => <span className="tabular-nums">{r.reference}</span> },
  { key: "customer", header: "Family", cell: (r) => r.customer.name },
  { key: "type", header: "Prayer type", cell: (r) => r.prayerType.name, hideBelow: "lg" },
  { key: "date", header: "Prayer date", cell: (r) => formatDate(r.prayerDate) },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => <span className="tabular-nums">{formatCurrency(r.amount)}</span>,
  },
  { key: "status", header: "Status", align: "right", cell: (r) => <StatusBadge status={r.status} /> },
];

async function IntentionsSection({ churchId }: { churchId: string }) {
  const result = await getIntentions(churchId, { limit: 20 }, { forPlatform: true });
  return result.data.length ? (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing the {result.data.length} most recent of {result.total} intentions. Detailed
        records stay inside the church workspace.
      </p>
      <DataTable columns={intentionColumns} rows={result.data} caption="Church intentions" />
    </div>
  ) : (
    <EmptyState title="No intentions recorded yet." />
  );
}

async function PaymentsSection({ churchId }: { churchId: string }) {
  const result = await getPayments(churchId, { limit: 20 }, { forPlatform: true });

  const columns: Column<PaymentView>[] = [
    {
      key: "reference",
      header: "Receipt",
      cell: (r) => <span className="tabular-nums">{r.intention?.reference ?? "—"}</span>,
    },
    { key: "customer", header: "Family", cell: (r) => r.customer.name },
    { key: "method", header: "Method", cell: (r) => <MethodBadge method={r.method} /> },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (r) => <span className="tabular-nums">{formatCurrency(r.amount)}</span>,
    },
    { key: "date", header: "Recorded", cell: (r) => formatDate(r.createdAt), hideBelow: "lg" },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (r) => <PaymentStatusBadge status={r.status} short />,
    },
  ];

  return result.data.length ? (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing the {result.data.length} most recent of {result.total} payments. Verification
        is carried out by the church itself.
      </p>
      <DataTable columns={columns} rows={result.data} caption="Church payments" />
    </div>
  ) : (
    <EmptyState title="No payments recorded yet." />
  );
}

async function ReportsSection({ churchId }: { churchId: string }) {
  const range = resolveRange("monthly");
  const report = await getReport({
    from: range.from,
    to: range.to,
    churchId,
    preset: "monthly",
    platform: true,
  });
  return <ReportView report={report} range={range} />;
}

function SettingsSection({
  church,
}: {
  church: NonNullable<Awaited<ReturnType<typeof getChurchBySlugForPlatform>>>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Church profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <DetailList>
            <DetailRow label="Name">{church.name}</DetailRow>
            <DetailRow label="Slug">/church/{church.slug}</DetailRow>
            <DetailRow label="Tagline">{church.tagline}</DetailRow>
            <DetailRow label="Established">{church.establishedYear}</DetailRow>
            <DetailRow label="Featured">{church.featured ? "Yes" : "No"}</DetailRow>
            <DetailRow label="Status">{church.isActive ? "Active" : "Inactive"}</DetailRow>
          </DetailList>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <address className="not-italic leading-relaxed text-foreground">
                {church.addressLine1}
                {church.addressLine2 ? <>, {church.addressLine2}</> : null}
                <br />
                {church.city}, {church.state} {church.postalCode}
              </address>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="text-foreground">{church.phone}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="break-all text-foreground">{church.email}</span>
            </li>
          </ul>
          <p className="mt-5 rounded-md border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            Parish details are maintained by the church administrator in their own workspace
            settings. The platform sees them but does not edit them here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
