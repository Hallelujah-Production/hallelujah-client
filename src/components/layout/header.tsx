import Link from "next/link";
import { Bell } from "lucide-react";
import { MobileDrawer, type BadgeCounts, type WorkspaceIdentity } from "./sidebar";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";
import type { NavSection } from "./nav-config";
import type { Role } from "@/lib/types";
import { BrandMark } from "./church-mark";

const SEARCH_TARGET: Record<Role, { action: string; placeholder: string }> = {
  SUPER_ADMIN: { action: "/super-admin/churches", placeholder: "Search churches…" },
  CHURCH_ADMIN: { action: "/intentions", placeholder: "Search intentions, receipts, people…" },
  CHURCH_STAFF: { action: "/my-prayers", placeholder: "Search my prayers…" },
};

/**
 * Application header. The workspace title is always the current tenant, so a
 * user can never be confused about which church's records are on screen.
 */
export function Header({
  identity,
  sections,
  badges,
  user,
  assignedChurches = [],
  currentChurchId = null,
}: {
  identity: WorkspaceIdentity;
  sections: NavSection[];
  badges: BadgeCounts;
  user: { name: string; email: string; initials: string; role: Role; roleLabel: string };
  assignedChurches?: { id: string; name: string }[];
  currentChurchId?: string | null;
}) {
  const search = SEARCH_TARGET[user.role];

  return (
    <header
      data-app-header
      data-print="hide"
      className="sticky top-0 z-20 border-b border-border bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-card/85"
    >
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:pl-6">
        <MobileDrawer sections={sections} identity={identity} badges={badges} />

      <div className={assignedChurches.length > 1 ? "hidden min-w-0 sm:block lg:hidden" : "min-w-0 lg:hidden"}>
        <BrandMark size="md" />
      </div>

      <div className="hidden min-w-0 flex-1 lg:block">
        <form action={search.action} role="search" className="relative max-w-md">
          <label htmlFor="global-search" className="sr-only">
            Search
          </label>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5L17 17" strokeLinecap="round" />
          </svg>
          <input
            id="global-search"
            name="search"
            type="search"
            placeholder={search.placeholder}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            suppressHydrationWarning
          />
        </form>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {currentChurchId && assignedChurches.length > 1 ? (
          <WorkspaceSwitcher churches={assignedChurches} currentId={currentChurchId} compact />
        ) : null}
        <Link
          href="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
          {badges.notifications > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-semibold text-accent-foreground">
              {badges.notifications > 9 ? "9+" : badges.notifications}
            </span>
          ) : null}
          <span className="sr-only">
            Notifications{badges.notifications > 0 ? ` (${badges.notifications} unread)` : ""}
          </span>
        </Link>

        <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />

        <UserMenu
          name={user.name}
          email={user.email}
          initials={user.initials}
          roleLabel={user.roleLabel}
          role={user.role}
        />
      </div>
      </div>
    </header>
  );
}
