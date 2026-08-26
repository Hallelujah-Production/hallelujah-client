import type { Metadata } from "next";
import { MyChurchesRegister } from "@/components/domain/my-churches-register";
import { requireChurchAdmin } from "@/lib/guards";
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
  const session = await requireChurchAdmin();
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

  const result = await getIntentionRegister(query);

  return (
    <MyChurchesRegister
      result={result}
      churches={session.assignedChurches}
      params={params}
      basePath="/my-churches"
      exportPath="/my-churches/export"
      currentChurchId={session.currentChurch.id}
      breadcrumbHome={{ label: "Dashboard", href: "/dashboard" }}
    />
  );
}
