const STEPS = [
  {
    number: "01",
    title: "Choose Your Church",
    body: "Find your parish in the directory and open its prayer page. Your intention is recorded in that church's own register and is never visible to any other parish.",
  },
  {
    number: "02",
    title: "Submit Your Prayer Intention",
    body: "Tell the church who the prayer is for, the kind of prayer you would like offered, the date you would like it said, and anything you want the priest to know.",
  },
  {
    number: "03",
    title: "Record Your Payment",
    body: "You pay the church the way you always have — cash at the counter, UPI, PhonePe, Google Pay or a bank transfer. Here you simply record what you paid, with a reference or a screenshot where you have one.",
  },
  {
    number: "04",
    title: "Receive Your Receipt",
    body: "A receipt number is issued immediately. Once the parish office confirms your offering against its own records, the receipt is authorised and ready to print.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className="container py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">Four steps</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
              The same process your parish already follows at the counter — written down
              once, and readable by everyone it concerns.
            </p>

            <div className="mt-7 rounded-lg border border-accent/25 bg-accent-muted/60 p-5">
              <h3 className="font-display text-sm font-semibold text-foreground">
                Payments stay with your church
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Hallelujah is a register, not a payment processor. There is no online
                checkout, no card handling and no gateway between you and your parish.
                The money reaches the church exactly as it does today; the platform only
                records what was received, so that a receipt can be issued and the
                intention tracked to completion.
              </p>
            </div>
          </div>

          <ol className="relative space-y-2">
            <span
              aria-hidden="true"
              className="absolute bottom-8 left-[1.4rem] top-8 w-px bg-gradient-to-b from-border via-border to-transparent"
            />
            {STEPS.map((step) => (
              <li key={step.number} className="relative flex gap-5 rounded-lg p-4 transition-colors hover:bg-card">
                <span
                  aria-hidden="true"
                  className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card font-display text-sm font-semibold text-primary shadow-sm"
                >
                  {step.number}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
