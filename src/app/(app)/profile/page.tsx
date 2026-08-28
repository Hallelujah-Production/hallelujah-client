import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, DetailList, DetailRow } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import { Badge } from "@/components/ui/badge";
import { ChurchMark } from "@/components/layout/church-mark";
import { requireChurchStaff } from "@/lib/guards";
import { getStaffStats } from "@/lib/services";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ChangePasswordForm } from "@/app/(app)/settings/change-password-form";

export const metadata: Metadata = {
  title: "My profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await requireChurchStaff();
  const user = session.currentUser;
  const church = session.currentChurch;

  const stats = await getStaffStats(church.id, user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
        title="My profile"
        description="Your account and your ministry at this church."
      />

      <StatGrid columns={4}>
        <StatCard label="Today" value={stats.today} tone="primary" emphasis />
        <StatCard label="Pending" value={stats.pending} tone={stats.pending ? "warning" : "default"} emphasis />
        <StatCard label="Completed" value={stats.completed} tone="success" emphasis />
        <StatCard label="Upcoming" value={stats.upcoming} tone="secondary" emphasis />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <Badge tone={user.isActive ? "success" : "neutral"}>
              <span aria-hidden="true">{user.isActive ? "✓" : "•"}</span>
              {user.isActive ? "Active" : "Deactivated"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-5 flex items-center gap-4">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
              >
                {user.avatarInitials}
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                  {user.name}
                </p>
                <p className="text-sm text-muted-foreground">Prayer Staff</p>
              </div>
            </div>

            <ul className="space-y-3 border-t border-border pt-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="break-all text-foreground">{user.email}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="tabular-nums text-foreground">{user.phone || "Not provided"}</span>
              </li>
            </ul>

            <div className="mt-5 rounded-md border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your name and email are managed by your church administrator. You can change your
                own password below.
              </p>
              <div className="mt-4">
                <ChangePasswordForm />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Church</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-5 flex items-center gap-4">
              <ChurchMark initials={church.logoInitials} accent={church.accent} size="lg" />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                  {church.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {church.city}, {church.state}
                </p>
              </div>
            </div>

            <DetailList className="border-t border-border pt-1">
              <DetailRow label="Parish phone">{church.phone}</DetailRow>
              <DetailRow label="Parish email">{church.email}</DetailRow>
              <DetailRow label="Member since">{formatDate(user.createdAt)}</DetailRow>
              <DetailRow label="Last active">{formatDateTime(user.lastActiveAt)}</DetailRow>
            </DetailList>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              You can see only the intentions assigned to you at this church. Revenue,
              payments, customers and settings are not part of the prayer staff role.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
