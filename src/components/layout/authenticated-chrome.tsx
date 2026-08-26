"use client";

import * as React from "react";
import { loadShellBadges } from "@/app/actions/shell";
import { Header } from "./header";
import { MobileTabBar, Sidebar, type BadgeCounts, type WorkspaceIdentity } from "./sidebar";
import { MOBILE_TABS, type NavSection } from "./nav-config";
import type { Role } from "@/lib/types";

const EMPTY_BADGES: BadgeCounts = { notifications: 0, paymentsPending: 0 };

export function AuthenticatedChrome({
  identity,
  sections,
  role,
  user,
  assignedChurches = [],
  currentChurchId = null,
  children,
}: {
  identity: WorkspaceIdentity;
  sections: NavSection[];
  role: Role;
  user: { name: string; email: string; initials: string; role: Role; roleLabel: string };
  assignedChurches?: { id: string; name: string }[];
  currentChurchId?: string | null;
  children: React.ReactNode;
}) {
  const [badges, setBadges] = React.useState<BadgeCounts>(EMPTY_BADGES);

  React.useEffect(() => {
    let cancelled = false;
    void loadShellBadges()
      .then((next) => {
        if (!cancelled) setBadges(next);
      })
      .catch(() => {
        // Nav badges are non-blocking; a failed count must not blank the shell.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh min-h-screen bg-background print:h-[297mm] print:min-h-0 print:w-[210mm] print:overflow-hidden">
      <Sidebar sections={sections} identity={identity} badges={badges} />

      <div className="lg:pl-64 print:!pl-0">
        <Header
          identity={identity}
          sections={sections}
          badges={badges}
          user={user}
          assignedChurches={assignedChurches}
          currentChurchId={currentChurchId}
        />

        <main
          id="main-content"
          className="mx-auto w-full max-w-[95rem] px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-10 print:!m-0 print:!max-w-none print:!p-0"
        >
          {children}
        </main>
      </div>

      <MobileTabBar items={MOBILE_TABS[role]} badges={badges} />
    </div>
  );
}
