import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PrayerIntentionForm } from "@/components/domain/prayer-intention-form";
import { requireChurchAdmin } from "@/lib/guards";
import { getAssignableStaff, getOfferedPrayerTypes } from "@/lib/services";

export const metadata: Metadata = {
  title: "Create a prayer intention",
  robots: { index: false, follow: false },
};

export default async function NewIntentionPage() {
  const session = await requireChurchAdmin();
  const [prayerTypes, assignableStaff] = await Promise.all([
    getOfferedPrayerTypes(),
    getAssignableStaff(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Intentions", href: "/intentions" },
          { label: "New" },
        ]}
        title="Create a prayer intention"
        description="Record the intention and offering, then choose which allotted church it belongs to and which prayer staff will offer it."
      />

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
        <PrayerIntentionForm
          church={session.currentChurch}
          assignedChurches={session.assignedChurches}
          prayerTypes={prayerTypes}
          assignableStaff={assignableStaff}
          mode="staff"
        />
      </div>
    </div>
  );
}
