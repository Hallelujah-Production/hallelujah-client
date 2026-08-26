import Link from "next/link";
import type { PrayerType } from "@/lib/types";
import { PrayerIcon } from "@/components/domain/prayer-icon";
import { formatCurrency } from "@/lib/utils";

export function PrayerServices({ prayerTypes }: { prayerTypes: PrayerType[] }) {
  return (
    <section id="services" className="scroll-mt-24 border-y border-border bg-card">
      <div className="container py-16 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow">Prayer services</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Every intention a parish is asked to carry
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
              From a child&apos;s birthday to a death anniversary. Each church chooses which
              of these it offers, and the amounts below are the customary offerings — your
              parish may ask for something different.
            </p>
          </div>
          <Link
            href="/churches"
            className="inline-flex h-11 items-center rounded-md border border-input bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Choose a church
          </Link>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {prayerTypes.map((type, index) => (
            <li key={type.id}>
              <article className="group h-full rounded-lg border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
                <PrayerIcon icon={type.icon} index={index} />
                <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-foreground">
                  {type.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {type.description}
                </p>
                <p className="mt-4 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
                  Customary offering{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(type.suggestedAmount)}
                  </span>
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
