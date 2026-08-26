"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import type { Church } from "@/lib/types";
import { ChurchCard } from "@/components/domain/church-card";
import { EmptyState } from "@/components/ui/states";

/**
 * Church finder.
 *
 * The public directory is small enough to filter in the browser, which keeps
 * the interaction instant. The same query shape (`search`, `location`) is what
 * the paginated `/churches` page sends to the service layer, so the switch to a
 * server-side search is a drop-in when the directory grows.
 */
export function ChurchFinder({ churches }: { churches: Church[] }) {
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("ALL");

  const cities = React.useMemo(
    () => Array.from(new Set(churches.map((c) => c.city))).sort(),
    [churches],
  );

  const results = React.useMemo(() => {
    const q = name.trim().toLowerCase();
    return churches.filter((church) => {
      const matchesName =
        !q ||
        church.name.toLowerCase().includes(q) ||
        church.tagline.toLowerCase().includes(q);
      const matchesLocation = location === "ALL" || church.city === location;
      return matchesName && matchesLocation;
    });
  }, [churches, name, location]);

  return (
    <section id="find-your-church" className="scroll-mt-24 border-y border-border bg-card">
      <div className="container py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">Church directory</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Find Your Church
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
            Search by parish name or by the town you live in. Every church keeps its own
            prayer register — your intention goes only to the church you choose.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-[1.6fr_1fr]">
          <div className="relative">
            <label htmlFor="finder-name" className="sr-only">
              Search by church name
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="finder-name"
              type="search"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Search by church name"
              className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              suppressHydrationWarning
            />
          </div>

          <div className="relative">
            <label htmlFor="finder-location" className="sr-only">
              Filter by location
            </label>
            <MapPin
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <select
              id="finder-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="h-12 w-full appearance-none rounded-md border border-input bg-background pl-10 pr-9 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              suppressHydrationWarning
            >
              <option value="ALL">All locations</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground" aria-live="polite">
          {results.length} {results.length === 1 ? "church" : "churches"} available
        </p>

        <div className="mt-8">
          {results.length ? (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {results.map((church) => (
                <li key={church.id}>
                  <ChurchCard church={church} variant="compact" className="h-full" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No churches match that search."
              description="Try a different parish name, or clear the location filter to see every church on the platform."
            />
          )}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Cannot find your parish?{" "}
          <Link href="/contact" className="font-medium text-primary underline underline-offset-4">
            Tell us about your church
          </Link>
        </p>
      </div>
    </section>
  );
}
