import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireSuperAdmin } from "@/lib/guards";
import { CreateChurchForm } from "./create-church-form";
import { getUsers } from "@/lib/services";

export const metadata: Metadata = {
  title: "Create church",
  robots: { index: false, follow: false },
};

export default async function NewChurchPage() {
  await requireSuperAdmin();
  const admins = await getUsers({ role: "CHURCH_ADMIN", status: "ACTIVE", limit: 100 });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Platform", href: "/super-admin" },
          { label: "Churches", href: "/super-admin/churches" },
          { label: "New" },
        ]}
        title="Create a church"
        description="Onboard a parish and assign an existing administrator, or invite a new one."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_18rem] xl:items-start">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
          <CreateChurchForm existingAdmins={admins.data.map((a) => ({ id: a.id, name: a.name, email: a.email }))} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-sm font-semibold text-foreground">
              What creating a church does
            </h2>
            <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2.5">
                <span className="font-semibold text-accent">01</span>Creates an isolated
                tenant with its own intentions, customers, payments and receipts.
              </li>
              <li className="flex gap-2.5">
                <span className="font-semibold text-accent">02</span>Publishes a public page
                at <code className="font-mono">/church/&lt;slug&gt;</code> where families can
                submit intentions.
              </li>
              <li className="flex gap-2.5">
                <span className="font-semibold text-accent">03</span>Assigns an existing Church Admin or
                invites a new one. One administrator may serve several parishes.
              </li>
              <li className="flex gap-2.5">
                <span className="font-semibold text-accent">04</span>Writes the whole action
                to the platform audit log.
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-accent/25 bg-accent-muted/50 p-5">
            <h2 className="font-display text-sm font-semibold text-foreground">
              Controlled onboarding
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Churches cannot register themselves. Every tenant is verified by the platform
              first, so no unverified parish can start collecting intentions in a
              congregation&apos;s name.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
