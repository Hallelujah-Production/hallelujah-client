import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { StatCard, StatGrid } from "@/components/data/stat-card";
import { EmptyState } from "@/components/ui/states";
import { requireChurchAdmin } from "@/lib/guards";
import { getChurchTeam } from "@/lib/services";
import { first, readNumberParam } from "@/lib/utils";
import { Pagination } from "@/components/data/pagination";
import { TeamManager } from "./team-manager";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireChurchAdmin();
  const params = await searchParams;

  const page = readNumberParam(first(params.page), 1);
  const search = first(params.search);

  const [team, adminPage, staffPage] = await Promise.all([
    getChurchTeam(session.currentChurch.id, {
      search,
      page,
      limit: 20,
    }),
    getChurchTeam(session.currentChurch.id, { role: "CHURCH_ADMIN", limit: 1 }),
    getChurchTeam(session.currentChurch.id, { role: "CHURCH_STAFF", limit: 1 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Team" }]}
        title="Team"
        description={`The people who run the prayer ministry at ${session.currentChurch.name}. Change role, deactivate, or delete from each card. When you add someone, allot them to the parish they should work in.`}
      />

      <StatGrid columns={3}>
        <StatCard label="Church admins" value={adminPage.total} emphasis />
        <StatCard label="Prayer staff" value={staffPage.total} emphasis />
        <StatCard
          label="On this page"
          value={`${team.data.length} of ${team.total}`}
          tone="success"
          emphasis
        />
      </StatGrid>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <SearchInput
          placeholder="Search team by name, email or phone…"
          label="Search team"
          className="max-w-xl"
        />
      </div>

      {search && !team.data.length ? (
        <EmptyState
          title="No team members match that search."
          description="Clear the search to see everyone on your parish team."
          icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
        />
      ) : null}

      <TeamManager
        members={team.data}
        currentUserId={session.currentUser.id}
        allottableChurches={session.assignedChurches}
        defaultChurchId={session.currentChurch.id}
      />

      {team.total ? (
        <Pagination
          page={team.page}
          totalPages={team.totalPages}
          total={team.total}
          limit={team.limit}
          basePath="/team"
          searchParams={params}
          itemLabel="members"
        />
      ) : null}
    </div>
  );
}
