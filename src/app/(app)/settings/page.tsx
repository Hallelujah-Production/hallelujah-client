import type { Metadata } from "next";
import Link from "next/link";
import { Info, Lock } from "lucide-react";
import { PageHeader, TabNav } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChurchMark } from "@/components/layout/church-mark";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getChurchTeam, getOfferedPrayerTypes, getOwnChurch, getPrayerTypeUsage } from "@/lib/services";
import { first, formatCurrency } from "@/lib/utils";
import { ChurchProfileForm } from "./church-profile-form";
import { ChangePasswordForm } from "./change-password-form";
import { ChurchPricingForm } from "./church-pricing-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "profile", label: "Church profile" },
  { id: "prayer-types", label: "Prayer types" },
  { id: "receipt", label: "Receipt branding" },
  { id: "staff", label: "Staff settings" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const section = first(params.section) ?? "profile";

  const sessionPromise = getSession();
  const profilePromise = section === "profile" ? getOwnChurch() : Promise.resolve(null);
  const typesPromise =
    section === "prayer-types"
      ? Promise.all([getOfferedPrayerTypes(), getPrayerTypeUsage()])
      : Promise.resolve([[], {}] as const);
  const teamPromise =
    section === "staff" ? getChurchTeam("", { limit: 60 }) : Promise.resolve(null);

  const [session, ownChurch, typesBundle, team] = await Promise.all([
    sessionPromise,
    profilePromise,
    typesPromise,
    teamPromise,
  ]);
  const admin = assertChurchAdmin(session);
  const church = admin.currentChurch;
  const prayerTypes = Array.isArray(typesBundle[0]) ? typesBundle[0] : [];
  const usage: Record<string, number> = { ...(typesBundle[1] as Record<string, number>) };
  const profileChurch = ownChurch ?? church;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
        title="Settings"
        description={`Profile, prayer catalogue and receipt details for ${church.name}.`}
      />

      <TabNav
        items={SECTIONS.map((item) => ({
          label: item.label,
          href: item.id === "profile" ? "/settings" : `/settings?section=${item.id}`,
          active: section === item.id,
        }))}
      />

      {section === "profile" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_18rem] xl:items-start">
          <Card>
            <CardContent className="p-6">
              <ChurchProfileForm church={profileChurch} />
            </CardContent>
          </Card>

          <aside className="space-y-4 xl:sticky xl:top-24">
            <Card>
              <CardHeader>
                <CardTitle>Church logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <ChurchMark initials={church.logoInitials} accent={church.accent} size="xl" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{church.logoInitials}</p>
                    <p className="text-xs text-muted-foreground">
                      Shown on your public page, in the workspace and on every receipt.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-md border border-dashed border-input bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
                  suppressHydrationWarning
                >
                  Upload a logo
                </button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Logo upload arrives with the backend, which will validate the file type
                  and store it in private object storage.
                </p>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Your password
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Changes go through the API. The new password is never stored in the browser.
              </p>
              <div className="mt-4">
                <ChangePasswordForm />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                Scope of these settings
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Everything on this page applies to {church.name} only. Platform-wide
                settings are managed by the Hallelujah team.
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      {section === "prayer-types" ? (
        <div className="space-y-5">
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              The prayer catalogue is maintained by the platform so that reporting is
              consistent across every parish. You can set this church&apos;s customary
              offering. Existing intentions keep the amount that was snapshotted when they
              were recorded.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {prayerTypes.map((type, index) => (
              <li key={type.id}>
                <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <PrayerIcon icon={type.icon} index={index} />
                    <Badge tone="neutral">{usage[type.id] ?? 0} recorded</Badge>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-foreground">
                    {type.name}
                  </h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {type.description}
                  </p>
                  <dl className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Customary offering</dt>
                      <dd className="font-medium tabular-nums text-foreground">
                        {formatCurrency(type.suggestedAmount)}
                      </dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-xs text-muted-foreground">Duration</dt>
                      <dd className="font-medium text-foreground">{type.durationMinutes} min</dd>
                    </div>
                  </dl>
                  <ChurchPricingForm prayerTypeId={type.id} amountRupees={type.suggestedAmount} />
                </article>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {section === "receipt" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_18rem] xl:items-start">
          <Card>
            <CardHeader>
              <CardTitle>Receipt branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every receipt carries your church name, address, phone and email exactly as
                entered under Church profile, together with the receipt number and the two
                signature lines.
              </p>

              <div className="rounded-md border border-border bg-muted/40 p-5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent">
                  Preview
                </p>
                <div className="mt-3 flex items-start gap-3 border-b-2 border-primary pb-4">
                  <ChurchMark initials={church.logoInitials} accent={church.accent} size="md" />
                  <div>
                    <p className="font-display text-base font-bold text-primary">{church.name}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {church.addressLine1}, {church.city} {church.postalCode}
                      <br />
                      {church.phone} · {church.email}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs font-semibold text-primary">
                  Thank you for your prayer intention.
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  May God bless you and your family.
                </p>
              </div>

              <Link
                href="/receipts"
                className="inline-flex h-10 items-center rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                See issued receipts
              </Link>
            </CardContent>
          </Card>

          <aside className="rounded-lg border border-border bg-muted/40 p-5 xl:sticky xl:top-24">
            <h2 className="font-display text-sm font-semibold text-foreground">
              Receipt numbering
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              References follow the pattern{" "}
              <code className="rounded bg-card px-1 py-0.5 font-mono text-[0.7rem] text-foreground">
                CH-YYYY-NNNNNN
              </code>
              . They are issued once, never reused, and stay with the intention, the payment
              and the printed receipt.
            </p>
          </aside>
        </div>
      ) : null}

      {section === "staff" ? (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Staff settings</CardTitle>
              <Link
                href="/team"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Manage team
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-muted/40 p-4">
                  <dt className="text-xs text-muted-foreground">Church admins</dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-foreground">
                    {team?.roleTotals?.admins ?? team?.data.filter((m) => m.role === "CHURCH_ADMIN").length ?? 0}
                  </dd>
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-4">
                  <dt className="text-xs text-muted-foreground">Prayer staff</dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-foreground">
                    {team?.roleTotals?.staff ?? team?.data.filter((m) => m.role === "CHURCH_STAFF").length ?? 0}
                  </dd>
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-4">
                  <dt className="text-xs text-muted-foreground">Active</dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-foreground">
                    {team?.data.filter((m) => m.isActive).length ?? 0}
                  </dd>
                </div>
              </dl>

              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span aria-hidden="true" className="text-accent">
                    •
                  </span>
                  Prayer staff see only the intentions assigned to them — never revenue,
                  payments, customers or settings.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true" className="text-accent">
                    •
                  </span>
                  Only active staff appear when assigning a prayer.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true" className="text-accent">
                    •
                  </span>
                  A church administrator cannot create a platform administrator.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
