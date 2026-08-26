import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Church } from "@/lib/types";
import { ChurchCard } from "@/components/domain/church-card";

export function FeaturedChurches({ churches }: { churches: Church[] }) {
  if (!churches.length) return null;

  return (
    <section className="border-t border-border bg-card">
      <div className="container py-16 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow">Featured churches</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Parishes already keeping their register here
            </h2>
          </div>
          <Link
            href="/churches"
            className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            View all churches
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {churches.map((church) => (
            <li key={church.id}>
              <ChurchCard church={church} className="h-full bg-background" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
