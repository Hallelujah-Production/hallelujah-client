import type { Metadata } from "next";
import { MyChurchesRegister } from "@/components/domain/my-churches-register";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getIntentionRegister } from "@/lib/services";
import type { IntentionQuery } from "@/lib/types";
import { first, readNumberParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Churches",
  robots: { index: false, follow: false },
};

export default async function MyChurchesPage({
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

  const [session, result] = await Promise.all([getSession(), getIntentionRegister(query)]);
  const admin = assertChurchAdmin(session);

  return (
    <MyChurchesRegister
      result={result}
      churches={admin.assignedChurches}
      params={params}
      basePath="/my-churches"
      exportPath="/my-churches/export"
      currentChurchId={admin.currentChurch.id}
      breadcrumbHome={{ label: "Dashboard", href: "/dashboard" }}
    />
  );
}
