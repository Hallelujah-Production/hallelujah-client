import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CounterIntentionForm } from "@/components/domain/counter-intention-form";
import { assertChurchAdmin } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getAssignableStaff, getOfferedPrayerTypes } from "@/lib/services";

export const metadata: Metadata = {
  title: "Create Intention",
  robots: { index: false, follow: false },
};

export default async function NewIntentionPage() {
  const [session, prayerTypes, assignableStaff] = await Promise.all([
    getSession(),
    getOfferedPrayerTypes(),
    getAssignableStaff(),
  ]);
  const admin = assertChurchAdmin(session);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Intention" />

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
        <CounterIntentionForm
          church={admin.currentChurch}
          assignedChurches={admin.assignedChurches}
          prayerTypes={prayerTypes}
          assignableStaff={assignableStaff}
        />
      </div>
    </div>
  );
}
