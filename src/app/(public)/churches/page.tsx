import type { Metadata } from "next";
import { getChurches } from "@/lib/services";
import { ChurchCard } from "@/components/domain/church-card";
import { EmptyState } from "@/components/ui/states";
import { first } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Churches",
  description:
    "Browse every parish keeping its prayer intention register on Hallelujah. Search by church name or town and open the parish that serves your family.",
  alternates: { canonical: "/churches" },
  openGraph: {
    title: "Churches on Hallelujah",
    description: "Browse every parish keeping its prayer intention register on Hallelujah.",
    url: "/churches",
  },
};

export default async function ChurchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = first(params.search) ?? "";
  const churches = await getChurches({ search });

  const byCity = churches.reduce<Record<string, typeof churches>>((acc, church) => {
    (acc[church.city] ??= []).push(church);
    return acc;
  }, {});

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container py-14 lg:py-20">
          <p className="eyebrow">Directory</p>
          <h1 className="mt-4 max-w-2xl font-display text-[1.75rem] font-semibold tracking-tight text-primary sm:text-4xl lg:text-5xl">
            Find the parish that will carry your intention
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            Every church below keeps its own prayer register. Choose yours to see its
            prayer services and submit an intention.
          </p>

          <form action="/churches" role="search" className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="church-search" className="sr-only">
                Search churches by name or town
              </label>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle cx="9" cy="9" r="5.5" />
                <path d="M13.5 13.5L17 17" strokeLinecap="round" />
              </svg>
              <input
                id="church-search"
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Search by church name or town"
                className="h-12 w-full rounded-md border border-input bg-card pl-10 pr-4 text-sm shadow-xs transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                suppressHydrationWarning
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              suppressHydrationWarning
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="container py-14">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {churches.length} {churches.length === 1 ? "church" : "churches"}
          {search ? ` matching “${search}”` : " on the platform"}
        </p>

        {churches.length ? (
          <div className="mt-8 space-y-12">
            {Object.entries(byCity)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([city, list]) => (
                <section key={city}>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    {city}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {list.length} {list.length === 1 ? "parish" : "parishes"}
                    </span>
                  </h2>
                  <div className="mt-1.5 hairline" />
                  <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((church) => (
                      <li key={church.id}>
                        <ChurchCard church={church} className="h-full" />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            title="No churches match that search."
            description="Try the parish name on its own, or the name of the town. If your church is not listed yet, we would be glad to hear from you."
            action={{ label: "Contact us", href: "/contact" }}
          />
        )}
      </div>
    </>
  );
}
