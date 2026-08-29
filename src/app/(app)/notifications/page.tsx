import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { PageHeader, TabNav } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/data/pagination";
import { MarkAllReadButton, NotificationItem } from "@/components/domain/notification-item";
import { assertAuth } from "@/lib/guards";
import { getSession } from "@/lib/session";
import { getNotifications, getUnreadCount, groupNotifications } from "@/lib/services";
import { addDays, first, readNumberParam, TODAY } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = first(params.filter) === "unread" ? "unread" : "all";
  const page = readNumberParam(first(params.page), 1);

  const dummyScope = { role: "CHURCH_STAFF" as const, userId: "", churchId: null };

  const [session, result, unreadCount] = await Promise.all([
    getSession(),
    getNotifications(dummyScope, { page, limit: 20 }),
    getUnreadCount(),
  ]);
  const auth = assertAuth(session);

  const visible =
    filter === "unread" ? result.data.filter((n) => !n.isRead) : result.data;
  const groups = groupNotifications(visible, TODAY, addDays(TODAY, -1));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          {
            label: auth.currentRole === "SUPER_ADMIN" ? "Platform" : "Dashboard",
            href: auth.currentRole === "SUPER_ADMIN" ? "/super-admin" : "/dashboard",
          },
          { label: "Notifications" },
        ]}
        title="Notifications"
        description={
          unreadCount
            ? `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}.`
            : "You are all caught up."
        }
        actions={<MarkAllReadButton disabled={unreadCount === 0} />}
      />

      <TabNav
        items={[
          { label: "All", href: "/notifications", active: filter === "all", count: result.total },
          {
            label: "Unread",
            href: "/notifications?filter=unread",
            active: filter === "unread",
            count: unreadCount,
          },
        ]}
      />

      {groups.length ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.label} className="space-y-3">
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </h2>
              <ul className="space-y-3">
                {group.items.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="h-5 w-5" aria-hidden="true" />}
          title={filter === "unread" ? "Nothing unread." : "No notifications yet."}
          description={
            filter === "unread"
              ? "Every notification has been read. New ones will appear here as they arrive."
              : "Prayers due today, new intentions, assignments and payment verifications all appear here."
          }
          action={filter === "unread" ? { label: "View all", href: "/notifications" } : undefined}
        />
      )}

      {result.data.length ? (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={result.limit}
          basePath="/notifications"
          searchParams={params}
          itemLabel="notifications"
        />
      ) : null}
    </div>
  );
}
