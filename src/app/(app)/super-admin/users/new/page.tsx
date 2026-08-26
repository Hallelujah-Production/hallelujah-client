import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireSuperAdmin } from "@/lib/guards";
import { getChurches } from "@/lib/services";
import { CreateUserForm } from "./create-user-form";

export const metadata: Metadata = {
  title: "Create user",
  robots: { index: false, follow: false },
};

export default async function NewUserPage() {
  await requireSuperAdmin();
  const churches = await getChurches();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "Platform", href: "/super-admin" },
          { label: "Users", href: "/super-admin/users" },
          { label: "New" },
        ]}
        title="Create a user"
        description="Accounts are provisioned by the platform. There is no public sign-up for church staff."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_18rem] xl:items-start">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
          <CreateUserForm churches={churches} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-sm font-semibold text-foreground">
              The three roles
            </h2>
            <dl className="mt-3 space-y-3 text-xs leading-relaxed">
              <div>
                <dt className="font-semibold text-foreground">Super Admin</dt>
                <dd className="text-muted-foreground">
                  Platform-wide: churches, users, the prayer catalogue, reports and audit
                  logs.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Church Admin</dt>
                <dd className="text-muted-foreground">
                  One church: intentions, customers, payments, receipts, team and settings.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Church Staff</dt>
                <dd className="text-muted-foreground">
                  One church, and only the prayers assigned to them. No revenue, payments or
                  settings.
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
