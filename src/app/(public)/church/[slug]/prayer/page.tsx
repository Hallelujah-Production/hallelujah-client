import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ShieldCheck } from "lucide-react";
import { getChurchBySlug, getChurchPrayerTypes } from "@/lib/services";
import { ChurchMark } from "@/components/layout/church-mark";
import { PrayerIntentionForm } from "@/components/domain/prayer-intention-form";
import { first } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const church = await getChurchBySlug(slug);
  if (!church) return { title: "Church not found" };

  return {
    title: `Submit a prayer intention — ${church.name}`,
    description: `Ask ${church.name}, ${church.city} to offer a prayer intention and record the offering you have already paid to the parish.`,
    alternates: { canonical: `/church/${church.slug}/prayer` },
    openGraph: {
      title: `Submit a prayer intention — ${church.name}`,
      description: `Ask ${church.name} to offer a prayer intention.`,
      url: `/church/${church.slug}/prayer`,
    },
  };
}

export default async function PrayerFormPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [church, prayerTypes] = await Promise.all([
    getChurchBySlug(slug),
    getChurchPrayerTypes(slug),
  ]);

  if (!church) notFound();

  const requestedType = first(query.type);
  const defaultType = prayerTypes.find((p) => p.id === requestedType)?.id;

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="container py-10 lg:py-14">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <li>
              <Link href="/churches" className="hover:text-foreground hover:underline">
                Churches
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">/</li>
            <li>
              <Link href={`/church/${church.slug}`} className="hover:text-foreground hover:underline">
                {church.name}
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">/</li>
            <li aria-current="page" className="text-foreground">Prayer intention</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-10">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-8">
            <header className="mb-8">
              <p className="eyebrow">Prayer intention</p>
              <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Ask {church.name} to pray with you
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Three short steps. You do not need an account, and no payment is taken on
                this page.
              </p>
            </header>

            <PrayerIntentionForm church={church} prayerTypes={prayerTypes} defaultPrayerTypeId={defaultType} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <ChurchMark initials={church.logoInitials} accent={church.accent} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {church.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {church.city}, {church.state}
                  </p>
                </div>
              </div>
              <address className="mt-4 border-t border-border pt-4 text-xs not-italic leading-relaxed text-muted-foreground">
                {church.addressLine1}
                <br />
                {church.city} {church.postalCode}
                <br />
                <a href={`tel:${church.phone.replace(/\s/g, "")}`} className="text-foreground hover:underline">
                  {church.phone}
                </a>
              </address>
            </div>

            <div className="rounded-lg border border-secondary/20 bg-secondary-muted/60 p-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
                No payment is taken here
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                You pay {church.name} directly — cash at the counter, UPI, PhonePe, Google
                Pay or a bank transfer. This form only records what you paid so the parish
                can issue an official receipt.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                What happens next
              </h2>
              <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
                <li className="flex gap-2.5">
                  <span className="font-semibold text-accent">01</span>
                  Your receipt number is issued immediately.
                </li>
                <li className="flex gap-2.5">
                  <span className="font-semibold text-accent">02</span>
                  The parish office verifies your offering against its records.
                </li>
                <li className="flex gap-2.5">
                  <span className="font-semibold text-accent">03</span>
                  A priest or sister is assigned to your intention.
                </li>
                <li className="flex gap-2.5">
                  <span className="font-semibold text-accent">04</span>
                  The prayer is offered on your chosen date and marked completed.
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
