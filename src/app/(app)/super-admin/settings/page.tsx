import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, DetailList, DetailRow } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { assertSuperAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getPlatformHeadcounts } from "@/lib/services";
import { PLATFORM_NAME } from "@/lib/brand";
import { ChangePasswordForm } from "@/app/(app)/settings/change-password-form";

export const metadata: Metadata = {
  title: "Platform settings",
  robots: { index: false, follow: false },
};

export default async function PlatformSettingsPage() {
  const [session, counts] = await Promise.all([getSession(), getPlatformHeadcounts()]);
  const admin = assertSuperAdmin(session);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Platform", href: "/super-admin" }, { label: "Settings" }]}
        title="Platform settings"
        description={`${PLATFORM_NAME} platform facts, your account, and how offerings are recorded.`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <DetailList>
              <DetailRow label="Platform name">{PLATFORM_NAME}</DetailRow>
              <DetailRow label="Churches">
                {counts.totalChurches} ({counts.activeChurches} active)
              </DetailRow>
              <DetailRow label="Accounts">
                {counts.totalUsers} ({counts.superAdmins} platform administrators)
              </DetailRow>
              <DetailRow label="Currency">Indian Rupee (₹)</DetailRow>
              <DetailRow label="Receipt format">CH-YYYY-NNNNNN</DetailRow>
            </DetailList>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href="/super-admin/churches">Churches</ButtonLink>
              <ButtonLink href="/super-admin/users">Users</ButtonLink>
              <ButtonLink href="/super-admin/prayer-types">Prayer types</ButtonLink>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signed in as</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <DetailList>
              <DetailRow label="Name">{admin.currentUser.name}</DetailRow>
              <DetailRow label="Email">{admin.currentUser.email}</DetailRow>
              <DetailRow label="Role">Platform Administrator</DetailRow>
              <DetailRow label="Scope">
                Every church on the platform. All actions are audit-logged.
              </DetailRow>
            </DetailList>
            <Link
              href="/super-admin/audit-logs"
              className="mt-4 inline-flex h-10 items-center rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              View audit logs
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md">
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment policy</CardTitle>
          <Badge tone="secondary">Fixed</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {PLATFORM_NAME} records offerings; it never collects them. There is no payment
            gateway, no checkout, no card handling, no webhook and no settlement anywhere
            in the platform. A family pays its parish directly — cash at the counter, UPI,
            PhonePe, Google Pay or a bank transfer — and the parish records what it received
            so a receipt can be issued.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is a product decision, not a configuration option, and it is why no
            settings on this page relate to money movement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-md border border-input bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}
