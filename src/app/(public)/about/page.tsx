import type { Metadata } from "next";
import Link from "next/link";
import { getChurches } from "@/lib/services";

export const metadata: Metadata = {
  title: "About",
  description:
    "Hallelujah digitises the prayer intention register that parishes already keep — the intention, the offering and the receipt in one place, with no payment gateway involved.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Hallelujah",
    description:
      "Hallelujah digitises the prayer intention register that parishes already keep.",
    url: "/about",
  },
};

const PRINCIPLES = [
  {
    title: "The parish stays in charge",
    body: "Hallelujah never stands between a family and its church. The offering is handed over exactly as it is today — at the counter, by UPI, by transfer. The platform records what the parish received and issues the receipt for it.",
  },
  {
    title: "One church, one register",
    body: "Each parish is a separate tenant with its own staff, customers, intentions, payments and reports. No church can read another church's records, and that boundary is enforced on the server rather than merely hidden in the interface.",
  },
  {
    title: "Every intention has an owner",
    body: "An intention moves from recorded, to verified, to assigned, to completed — and each step names the person responsible and the time it happened. Nothing sits in an unread notebook.",
  },
  {
    title: "A receipt you can hand over",
    body: "The receipt is numbered once and stays attached to the intention and its payment. It prints on ordinary A4 with the church's own details on it, so it can be given to the family at the counter.",
  },
];

export default async function AboutPage() {
  const churches = await getChurches();
  const stats = {
    activeChurches: churches.length,
    totalIntentions: 0,
    totalStaff: 0,
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container py-16 lg:py-24">
          <p className="eyebrow">About</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-primary sm:text-5xl">
            The prayer register your parish already keeps — written once, and readable by
            everyone it concerns.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            For generations the process has been the same. A family comes to the church,
            asks for a prayer, hands over an offering, and the parish writes it down.
            Hallelujah changes none of that. It only makes sure the writing down is complete,
            searchable and safe.
          </p>
        </div>
      </section>

      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              What we believe
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Four commitments shape every screen in this platform.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
              <div>
                <dt className="text-xs text-muted-foreground">Churches</dt>
                <dd className="font-display text-2xl font-semibold text-foreground tabular-nums">
                  {stats.activeChurches}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Intentions</dt>
                <dd className="font-display text-2xl font-semibold text-foreground tabular-nums">
                  {stats.totalIntentions.toLocaleString("en-IN")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Prayer staff</dt>
                <dd className="font-display text-2xl font-semibold text-foreground tabular-nums">
                  {stats.totalStaff}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Gateways used</dt>
                <dd className="font-display text-2xl font-semibold text-foreground">None</dd>
              </div>
            </dl>
          </div>

          <ul className="space-y-8">
            {PRINCIPLES.map((principle, index) => (
              <li key={principle.title} className="rounded-lg border border-border bg-card p-6">
                <p className="font-display text-sm font-semibold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground">
                  {principle.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {principle.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="border-t border-border bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-12">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Ready to see it with your own parish&apos;s details?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Church accounts are created by our team, so your workspace arrives ready to
              use on the first day.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Contact us
            </Link>
            <Link
              href="/churches"
              className="inline-flex h-11 items-center rounded-md border border-input bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Browse churches
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
