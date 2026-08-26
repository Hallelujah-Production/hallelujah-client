import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the Hallelujah team about bringing your church's prayer intention register online. We create and verify every church account ourselves.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Hallelujah",
    description: "Talk to us about bringing your church's prayer register online.",
    url: "/contact",
  },
};

const FAQS = [
  {
    question: "Does Hallelujah collect the offering online?",
    answer:
      "No. There is no payment gateway, no checkout and no card handling anywhere in the platform. The family pays your church directly, exactly as it does today, and the platform records what was received so a receipt can be issued.",
  },
  {
    question: "Can a family create an account?",
    answer:
      "It does not need to. Anyone can submit an intention from your church's public page without registering. Only church staff sign in, and those accounts are created by us or by your church administrator.",
  },
  {
    question: "Who can see our church's records?",
    answer:
      "Only your church. Intentions, customers, payments, receipts and reports are scoped to your parish, and no other church administrator can reach them.",
  },
  {
    question: "What do we need to get started?",
    answer:
      "Your church name, address, phone number and the name of the person who will act as administrator. We create the workspace and hand over the account.",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container py-14 lg:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            Bring your church&apos;s prayer workflow online.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            Tell us about your parish. We will set up your church, create the
            administrator account and walk your team through recording their first
            intention.
          </p>
        </div>
      </section>

      <div className="container grid gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-20">
        <div className="order-2 lg:order-1">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Send us a message
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Fields marked with an asterisk are required.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <section className="mt-12">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              Questions parishes usually ask
            </h2>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              {FAQS.map((faq) => (
                <div key={faq.question} className="py-5">
                  <dt className="font-display text-[0.95rem] font-semibold text-foreground">
                    {faq.question}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="order-1 space-y-6 lg:order-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
              Reach us directly
            </h2>
            <ul className="mt-5 space-y-5">
              <Line icon={Mail} label="Email" value="hello@hallelujah.app" href="mailto:hello@hallelujah.app" />
              <Line icon={Phone} label="Phone" value="+91 89122 40118" href="tel:+918912240118" />
              <Line
                icon={MapPin}
                label="Office"
                value="2nd Floor, Siripuram Junction, Visakhapatnam 530003, Andhra Pradesh"
              />
            </ul>
          </div>

          <div className="rounded-lg border border-accent/25 bg-accent-muted/60 p-6">
            <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
              Office hours
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Monday – Friday</dt>
                <dd className="font-medium text-foreground">9:30 AM – 6:00 PM</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Saturday</dt>
                <dd className="font-medium text-foreground">9:30 AM – 1:00 PM</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Sunday</dt>
                <dd className="font-medium text-foreground">Closed</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}

function Line({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <li className="flex items-start gap-3.5">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-muted text-primary"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        {href ? (
          <a href={href} className="block text-sm font-medium text-foreground underline-offset-4 hover:underline">
            {value}
          </a>
        ) : (
          <span className="block text-sm font-medium text-foreground">{value}</span>
        )}
      </span>
    </li>
  );
}
