import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { getAllChurchSlugs, getChurchBySlug, getChurchPrayerTypes } from "@/lib/services";
import { PLATFORM_NAME, PLATFORM_SITE_URL } from "@/lib/brand";
import { ChurchMark } from "@/components/layout/church-mark";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllChurchSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const church = await getChurchBySlug(slug);
  if (!church) return { title: "Church not found" };

  const title = `${church.name} | ${PLATFORM_NAME}`;
  const description = `${church.tagline}. Submit a prayer intention to ${church.name}, ${church.city} and receive an official receipt. Offerings are paid directly to the parish.`;

  return {
    title: church.name,
    description,
    alternates: { canonical: `/church/${church.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/church/${church.slug}`,
      siteName: PLATFORM_NAME,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function ChurchPage({ params }: PageProps) {
  const { slug } = await params;
  const [church, prayerTypes] = await Promise.all([
    getChurchBySlug(slug),
    getChurchPrayerTypes(slug),
  ]);

  if (!church) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: church.name,
    description: church.description,
    telephone: church.phone,
    email: church.email,
    foundingDate: String(church.establishedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: church.addressLine1,
      addressLocality: church.city,
      addressRegion: church.state,
      postalCode: church.postalCode,
      addressCountry: "IN",
    },
    url: `${PLATFORM_SITE_URL}/church/${church.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container py-14 lg:py-20">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-border">/</li>
              <li>
                <Link href="/churches" className="hover:text-foreground hover:underline">
                  Churches
                </Link>
              </li>
              <li aria-hidden="true" className="text-border">/</li>
              <li aria-current="page" className="text-foreground">{church.name}</li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-5">
                <ChurchMark initials={church.logoInitials} accent={church.accent} size="xl" />
                <div>
                  <p className="eyebrow">Established {church.establishedYear}</p>
                  <h1 className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight text-primary sm:text-4xl lg:text-5xl">
                    {church.name}
                  </h1>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {church.city}, {church.state}
                  </p>
                </div>
              </div>

              <p className="mt-7 max-w-2xl font-display text-xl leading-snug text-secondary">
                {church.tagline}
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
                {church.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/church/${church.slug}/prayer`}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-[0.9375rem] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Submit a Prayer Intention
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <a
                  href={`tel:${church.phone.replace(/\s/g, "")}`}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-card px-6 text-[0.9375rem] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Call the parish office
                </a>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
                  Parish office
                </h2>
                <ul className="mt-5 space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <address className="min-w-0 not-italic leading-relaxed text-foreground [overflow-wrap:anywhere]">
                      {church.addressLine1}
                      {church.addressLine2 ? (
                        <>
                          <br />
                          {church.addressLine2}
                        </>
                      ) : null}
                      <br />
                      {church.city}, {church.state} {church.postalCode}
                    </address>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <a href={`tel:${church.phone.replace(/\s/g, "")}`} className="text-foreground hover:underline">
                      {church.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <a href={`mailto:${church.email}`} className="break-all text-foreground hover:underline">
                      {church.email}
                    </a>
                  </li>
                </ul>
              </div>

              {church.serviceTimes.length ? (
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Service times
                  </h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    {church.serviceTimes.map((service) => (
                      <div key={service.label} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                        <dt className="text-muted-foreground">{service.label}</dt>
                        <dd className="font-medium text-foreground">{service.time}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <section className="container py-14 lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Prayer services</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">
            Intentions {church.name} will carry for you
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
            Choose the kind of prayer when you submit your intention. The amounts shown are
            the customary offerings — speak to the parish office if you would like to give
            differently.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {prayerTypes.map((type, index) => (
            <li key={type.id}>
              <Link
                href={`/church/${church.slug}/prayer?type=${type.id}`}
                className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <PrayerIcon icon={type.icon} index={index} />
                <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-foreground">
                  {type.name}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {type.description}
                </p>
                <p className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3 text-xs">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(type.suggestedAmount)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    Choose
                    <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border bg-card">
        <div className="container py-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Your offering goes straight to {church.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pay the parish however you normally do — cash at the counter, UPI, PhonePe,
                Google Pay or a bank transfer — then record it here so the office can issue
                your receipt. Hallelujah never handles the money.
              </p>
            </div>
            <Link
              href={`/church/${church.slug}/prayer`}
              className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Start your intention
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
