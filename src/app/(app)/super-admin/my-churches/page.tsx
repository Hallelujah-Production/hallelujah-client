import type { Metadata } from "next";
import { MyChurchesRegister } from "@/components/domain/my-churches-register";
import { assertSuperAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getChurchViews, getIntentionRegister } from "@/lib/services";
import type { IntentionQuery } from "@/lib/types";
import { first, readNumberParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Churches",
  robots: { index: false, follow: false },
};

export default async function SuperAdminMyChurchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const query: IntentionQuery = {
    page: readNumberParam(first(params.page), 1),
    limit: 20,
    search: first(params.search),
    parishId: first(params.parish),
    progress: (first(params.progress) as IntentionQuery["progress"]) ?? "ALL",
    from: first(params.from),
    to: first(params.to),
  };

  const [session, result, churches] = await Promise.all([
    getSession(),
    getIntentionRegister(query),
    getChurchViews({ status: "ACTIVE", limit: 100 }),
  ]);
  assertSuperAdmin(session);

  return (
    <MyChurchesRegister
      result={result}
      churches={churches.data}
      params={params}
      basePath="/super-admin/my-churches"
      exportPath="/super-admin/my-churches/export"
      breadcrumbHome={{ label: "Platform", href: "/super-admin" }}
      description="Every intention across Hallelujah churches: who created it, for whom, which church, and whether prayer is still pending or completed."
      footnote="Filter by church, prayer date, and pending or completed. CSV downloads the filtered list."
    />
  );
}
