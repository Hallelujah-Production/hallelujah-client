import type { Metadata } from "next";
import { getChurches, getFeaturedChurches, getPrayerTypes } from "@/lib/services";
import { Hero } from "@/components/marketing/hero";
import { ChurchFinder } from "@/components/marketing/church-finder";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PrayerServices } from "@/components/marketing/prayer-services";
import { TrustSection } from "@/components/marketing/trust-section";
import { FeaturedChurches } from "@/components/marketing/featured-churches";
import { ContactCta } from "@/components/marketing/contact-cta";
import { PLATFORM_NAME, PLATFORM_SITE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: { absolute: "Hallelujah — Prayer intentions for your church" },
  description:
    "Find your church, submit a prayer intention and receive an official receipt. Offerings are paid directly to your parish and recorded here — no online payment gateway.",
  alternates: { canonical: "/" },
};

export default async function LandingPage() {
  const [churches, featured, prayerTypes] = await Promise.all([
    getChurches(),
    getFeaturedChurches(4),
    getPrayerTypes(),
  ]);
  const stats = { activeChurches: churches.length, totalIntentions: 0, completed: 0 };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: PLATFORM_NAME,
    url: PLATFORM_SITE_URL,
    description:
      "A multi-church platform for submitting prayer intentions and recording offerings made directly to a parish.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${PLATFORM_SITE_URL}/churches?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero churchCount={stats.activeChurches} intentionCount={stats.totalIntentions} />
      <ChurchFinder churches={churches} />
      <HowItWorks />
      <PrayerServices prayerTypes={prayerTypes} />
      <TrustSection
        churchCount={stats.activeChurches}
        intentionCount={stats.totalIntentions}
        completedCount={stats.completed}
      />
      <FeaturedChurches churches={featured} />
      <ContactCta />
    </>
  );
}
