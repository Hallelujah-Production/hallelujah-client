import "server-only";

import { redirect } from "next/navigation";
import { getSession, landingRouteForRole, type Session } from "@/lib/session";
import type { Church, Role } from "@/lib/types";

/**
 * Route guards.
 *
 * These decide what a signed-in user is *shown*. They are not a security
 * boundary — a guard that redirects has still read nothing it should not have,
 * because every service call below takes its tenant id from the session these
 * guards return. The NestJS backend will re-check the same rules on every
 * request, and that check is the one that counts.
 */

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRoles(roles: Role[]): Promise<Session> {
  const session = await requireAuth();
  if (!roles.includes(session.currentRole)) {
    redirect(landingRouteForRole(session.currentRole));
  }
  return session;
}

/** A church workspace session: guarantees a tenant is present. */
export interface ChurchSession extends Session {
  currentChurch: Church;
}

export async function requireChurchSession(
  roles: Role[] = ["CHURCH_ADMIN", "CHURCH_STAFF"],
): Promise<ChurchSession> {
  const session = await requireRoles(roles);
  if (!session.currentChurch) redirect("/super-admin");
  return session as ChurchSession;
}

export async function requireChurchAdmin(): Promise<ChurchSession> {
  return requireChurchSession(["CHURCH_ADMIN"]);
}

export async function requireChurchStaff(): Promise<ChurchSession> {
  return requireChurchSession(["CHURCH_STAFF"]);
}

export async function requireSuperAdmin(): Promise<Session> {
  return requireRoles(["SUPER_ADMIN"]);
}

/**
 * Role checks on an already-resolved session. Use these after
 * `Promise.all([getSession(), getPageData()])` so page data is not blocked
 * on /auth/me. Nest still authenticates every API call.
 */
export function assertAuth(session: Session | null): Session {
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/change-password");
  return session;
}

export function assertRoles(session: Session | null, roles: Role[]): Session {
  const resolved = assertAuth(session);
  if (!roles.includes(resolved.currentRole)) {
    redirect(landingRouteForRole(resolved.currentRole));
  }
  return resolved;
}

export function assertChurchSession(
  session: Session | null,
  roles: Role[] = ["CHURCH_ADMIN", "CHURCH_STAFF"],
): ChurchSession {
  const resolved = assertRoles(session, roles);
  if (!resolved.currentChurch) redirect("/super-admin");
  return resolved as ChurchSession;
}

export function assertChurchAdmin(session: Session | null): ChurchSession {
  return assertChurchSession(session, ["CHURCH_ADMIN"]);
}

export function assertChurchStaff(session: Session | null): ChurchSession {
  return assertChurchSession(session, ["CHURCH_STAFF"]);
}

export function assertSuperAdmin(session: Session | null): Session {
  return assertRoles(session, ["SUPER_ADMIN"]);
}
