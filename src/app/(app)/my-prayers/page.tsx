import type { Metadata } from "next";
import { PageHeader, TabNav } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { Pagination } from "@/components/data/pagination";
import { PrayerCard } from "@/components/domain/prayer-card";
import { EmptyState } from "@/components/ui/states";
import { assertChurchStaff } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getStaffIntentions, getStaffStats, type StaffScope } from "@/lib/services";
import { first, readNumberParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My prayers",
  robots: { index: false, follow: false },
};

export default async function MyPrayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const scopeParam = first(params.scope);
  const scope: StaffScope =
    scopeParam === "today" || scopeParam === "upcoming" || scopeParam === "completed"
      ? scopeParam
      : "all";

  const [session, result, stats] = await Promise.all([
    getSession(),
    getStaffIntentions("", "", scope, {
      page: readNumberParam(first(params.page), 1),
      limit: 20,
      search: first(params.search),
    }),
    getStaffStats("", ""),
  ]);
  const staffSession = assertChurchStaff(session);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Prayers" }]}
        title="My prayers"
        description={`Intentions assigned to you at ${staffSession.currentChurch.name}.`}
      />

      <TabNav
        items={[
          { label: "All", href: "/my-prayers", active: scope === "all", count: result.total },
          { label: "Today", href: "/my-prayers?scope=today", active: scope === "today", count: stats.today },
          {
            label: "Upcoming",
            href: "/my-prayers?scope=upcoming",
            active: scope === "upcoming",
            count: stats.upcoming,
          },
          {
            label: "Completed",
            href: "/my-prayers?scope=completed",
            active: scope === "completed",
            count: stats.completed,
          },
        ]}
      />

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search by receipt or the person prayed for…"
          label="Search my prayers"
          className="max-w-xl"
        />
      </div>

      {result.data.length ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.data.map((intention, index) => (
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

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            limit={result.limit}
            basePath="/my-prayers"
            searchParams={params}
            itemLabel="prayers"
          />
        </>
      ) : (
        <EmptyState
          title="No prayers here."
          description="When the parish office allots an intention to you it appears here, with everything you need to offer it."
          action={{ label: "Back to dashboard", href: "/dashboard" }}
        />
      )}
    </div>
  );
}
