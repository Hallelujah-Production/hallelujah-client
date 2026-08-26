import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/guards";
import { buildIntentionRegisterCsv } from "@/lib/services";
import type { IntentionQuery } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireSuperAdmin();
  const { searchParams } = new URL(request.url);
  const query: Omit<IntentionQuery, "page" | "limit"> = {
    search: searchParams.get("search") ?? undefined,
    parishId: searchParams.get("parish") ?? undefined,
    progress: (searchParams.get("progress") as IntentionQuery["progress"]) ?? "ALL",
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  };

  const { csv } = await buildIntentionRegisterCsv(query);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-churches.csv"',
      "Cache-Control": "no-store",
    },
  });
}
