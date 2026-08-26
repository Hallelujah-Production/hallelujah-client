import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms on which Hallelujah provides a prayer intention register to churches and to the families who submit intentions.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    title: "What Hallelujah is",
    body: "Hallelujah is a record-keeping platform for churches. It stores prayer intentions, the offerings a church has received for them, and the receipts a church issues. It is not a payment service and does not act as an intermediary for money.",
  },
  {
    title: "Payments are between you and your church",
    body: "Any offering is paid directly to the church, by whatever method that church accepts. Hallelujah does not collect, hold, transfer or refund money, and integrates no payment gateway. A record on this platform is evidence of what a church recorded — the church's own accounts remain authoritative.",
  },
  {
    title: "Accuracy of what you submit",
    body: "You are responsible for the accuracy of the details you enter, including the amount and any transaction reference. A church may reject a payment record it cannot reconcile with its own books, and will say why.",
  },
  {
    title: "Church accounts",
    body: "Church accounts are created by the Hallelujah team, not by public registration. A church administrator is responsible for the staff accounts they create and for the conduct of those accounts within their parish workspace.",
  },
  {
    title: "Availability",
    body: "We aim to keep the platform available at all times but do not guarantee uninterrupted service. A parish should continue to keep whatever records its diocese requires.",
  },
  {
    title: "Changes",
    body: "These terms may be updated as the platform develops. Material changes will be notified to church administrators before they take effect.",
  },
];

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-14 lg:py-20">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-primary">
        Terms
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        These terms describe what Hallelujah does, and — just as importantly — what it does
        not do.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
