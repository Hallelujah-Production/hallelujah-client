import * as React from "react";
import { AuthenticatedChrome } from "./authenticated-chrome";
import { NAVIGATION, WORKSPACE_LABEL } from "./nav-config";
import type { WorkspaceIdentity } from "./sidebar";
import type { Session } from "@/lib/session";

/**
 * The one authenticated shell.
 *
 * Badge counts load after first paint so login is not blocked on
 * notifications + pending payments.
 */
export function AppShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const { currentUser, currentRole, currentChurch, assignedChurches } = session;
  const sections = NAVIGATION[currentRole];

  const identity: WorkspaceIdentity = currentChurch
    ? {
        title: currentChurch.name,
        subtitle: WORKSPACE_LABEL[currentRole],
        initials: currentChurch.logoInitials,
        accent: currentChurch.accent,
        isPlatform: false,
      }
    : {
        title: "Platform Administration",
        subtitle: "Hallelujah",
        initials: "HA",
        accent: "navy",
        isPlatform: true,
      };

  return (
    <AuthenticatedChrome
      identity={identity}
      sections={sections}
      role={currentRole}
      assignedChurches={assignedChurches}
      currentChurchId={currentChurch?.id ?? null}
      user={{
        name: currentUser.name,
        username: currentUser.username,
        initials: currentUser.avatarInitials,
        role: currentRole,
        roleLabel: WORKSPACE_LABEL[currentRole],
      }}
    >
      {children}
    </AuthenticatedChrome>
  );
}
