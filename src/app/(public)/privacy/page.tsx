import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Hallelujah handles the personal information a family shares when submitting a prayer intention, and how payment proof is stored.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "What we collect",
    body: "When you submit a prayer intention we record your name and mobile number, and — only if you provide them — your email address and postal address. We also record the intention itself: the prayer type, the person it is offered for, the date and any message you write for the priest.",
  },
  {
    title: "Payment information",
    body: "Hallelujah does not process payments and never sees a card number, a UPI PIN or a bank credential. What we store is the record of a payment you made directly to your church: the amount, the method, a reference number where one exists, and any screenshot you choose to attach.",
  },
  {
    title: "Payment proof images",
    body: "A screenshot you upload is treated as sensitive. It is held in private storage, is never publicly addressable, and is shown only to staff of the church you submitted to, through short-lived links that expire.",
  },
  {
    title: "Who can see your information",
    body: "Only the church you chose. Each parish is a separate tenant, and no other church administrator or staff member can reach your intention, your payment or your receipt. Platform administrators can see aggregate figures and are subject to audit logging.",
  },
  {
    title: "How long we keep it",
    body: "Intentions and receipts are parish records and are retained for as long as the church needs them for its own accounting. You may ask your parish office to correct or remove your details at any time.",
  },
  {
    title: "Contact",
    body: "Write to hello@hallelujah.app with any question about this policy, or speak to your parish office directly.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-14 lg:py-20">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-primary">
        Privacy
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Hallelujah holds parish records on behalf of churches. This page explains what is
        collected when you submit a prayer intention and who is able to see it.
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
