import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { requireChurchAdmin } from "@/lib/guards";
import { getIntentionById } from "@/lib/services";
import { IntentionEditForm } from "./intention-edit-form";

export const metadata: Metadata = {
  title: "Update prayer intention",
  robots: { index: false, follow: false },
};

export default async function EditIntentionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireChurchAdmin();
  const { id } = await params;
  const intention = await getIntentionById(session.currentChurch.id, id);
  if (!intention) notFound();

  const closed = intention.status === "COMPLETED" || intention.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Intentions", href: "/intentions" },
          { label: intention.reference, href: `/intentions/${id}` },
          { label: "Update" },
        ]}
        title={`Update ${intention.reference}`}
        description={closed ? "Completed or cancelled intentions cannot be edited." : "Change the prayer details. The recorded offering is not changed here."}
      />
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
        {closed ? (
          <p className="text-sm text-muted-foreground">This intention is closed and cannot be updated.</p>
        ) : (
          <IntentionEditForm intention={intention} />
        )}
      </div>
    </div>
  );
}
