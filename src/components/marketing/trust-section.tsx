import {
  BellRing,
  Building2,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  ReceiptText,
  UserCheck,
  Wallet,
} from "lucide-react";

const BENEFITS = [
  {
    icon: ClipboardList,
    title: "Organised prayer management",
    body: "Every intention has a record: who asked, who it is for, when it should be prayed and where it stands right now.",
  },
  {
    icon: Wallet,
    title: "Clear payment records",
    body: "Cash, UPI, PhonePe, Google Pay or bank transfer — each offering is recorded with its method, reference and proof.",
  },
  {
    icon: ReceiptText,
    title: "Official receipts",
    body: "A numbered receipt is issued for every intention and prints cleanly on an ordinary office printer.",
  },
  {
    icon: Building2,
    title: "Church-specific dashboards",
    body: "Each parish sees its own day: today's prayers, today's collection and what is still waiting for attention.",
  },
  {
    icon: UserCheck,
    title: "Prayer assignment",
    body: "The parish office assigns each intention to a priest, sister or brother, so nothing is left unclaimed.",
  },
  {
    icon: CheckCircle2,
    title: "Completion tracking",
    body: "Prayer staff mark an intention completed when it has been offered, with the time and the person recorded.",
  },
  {
    icon: BellRing,
    title: "Notifications",
    body: "The day's prayers, tomorrow's schedule, new intentions and payments awaiting verification are surfaced as they happen.",
  },
  {
    icon: LockKeyhole,
    title: "Secure tenant separation",
    body: "One church can never see another church's intentions, customers, payments or reports. Isolation is enforced on the server.",
  },
];

export function TrustSection({
  churchCount = 0,
  intentionCount = 0,
  completedCount = 0,
}: {
  churchCount?: number;
  intentionCount?: number;
  completedCount?: number;
}) {
  const churches = churchCount ?? 0;
  const intentions = intentionCount ?? 0;
  const completed = completedCount ?? 0;
  const completionRate = intentions ? Math.round((completed / intentions) * 100) : 0;

  return (
    <section id="trust" className="scroll-mt-24">
      <div className="container py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">Why parishes use Hallelujah</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A register your parish can trust
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            Nothing about how your church receives an offering changes. What changes is
            that the intention, the payment and the receipt stop living in three different
            notebooks.
          </p>
        </div>

        <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
          <Stat label="Churches on the platform" value={String(churches)} />
          <Stat label="Intentions recorded" value={intentions.toLocaleString("en-IN")} />
          <Stat label="Prayers completed" value={completed.toLocaleString("en-IN")} />
          <Stat label="Completion rate" value={`${completionRate}%`} />
        </dl>

        <ul className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title}>
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-primary shadow-xs"
              >
                <benefit.icon className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-[0.95rem] font-semibold tracking-tight text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                {benefit.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-5 py-6 text-center">
      <dd className="font-display text-3xl font-semibold tracking-tight text-primary tabular-nums">
        {value}
      </dd>
      <dt className="mt-1 text-xs leading-relaxed text-muted-foreground">{label}</dt>
    </div>
  );
}
