import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/data/pagination";
import { PrayerCard } from "@/components/domain/prayer-card";
import { EmptyState } from "@/components/ui/states";
import { assertChurchStaff } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getStaffIntentions } from "@/lib/services";
import type { IntentionView } from "@/lib/types";
import { addDays, first, formatLongDate, readNumberParam, TODAY } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Upcoming prayers",
  robots: { index: false, follow: false },
};

export default async function UpcomingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [session, result] = await Promise.all([
    getSession(),
    getStaffIntentions("", "", "upcoming", {
      page: readNumberParam(first(params.page), 1),
      limit: 18,
    }),
  ]);
  assertChurchStaff(session);

  // Group by prayer date so a staff member reads their week, not a flat list.
  const groups = result.data.reduce<Record<string, IntentionView[]>>((acc, intention) => {
    (acc[intention.prayerDate] ??= []).push(intention);
    return acc;
  }, {});

  const tomorrow = addDays(TODAY, 1);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Upcoming" }]}
        title="Upcoming prayers"
        description="Intentions assigned to you for the days ahead."
      />

      {groups[tomorrow]?.length ? (
        <p className="flex items-center gap-2 rounded-lg border border-info/25 bg-info-muted px-4 py-3 text-sm text-info">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Tomorrow</strong> — {groups[tomorrow].length}{" "}
            prayer {groups[tomorrow].length === 1 ? "intention" : "intentions"}.
          </span>
        </p>
      ) : null}

      {result.data.length ? (
        <>
          <div className="space-y-8">
            {Object.entries(groups).map(([date, items]) => (
              <section key={date} className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    {formatLongDate(date)}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {date === tomorrow ? "Tomorrow · " : ""}
                    {items.length} {items.length === 1 ? "intention" : "intentions"}
                  </span>
                </div>
                <div className="hairline" />
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((intention, index) => (
                    <li key={intention.id}>
                      <PrayerCard
                        intention={intention}
                        href={`/my-prayers/${intention.id}`}
                        index={index}
                        className="h-full"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            limit={result.limit}
            basePath="/upcoming"
            searchParams={params}
            itemLabel="upcoming prayers"
          />
        </>
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
          title="Nothing scheduled ahead."
          description="You have no upcoming intentions allotted to you yet. The parish office allots them when they record an intention."
          action={{ label: "Back to dashboard", href: "/dashboard" }}
        />
      )}
    </div>
  );
}
