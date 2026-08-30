import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { apiGet, hasSessionCookie } from "@/lib/api/client";
import {
  ACCESS_COOKIE,
  parseCookieHeader,
  peekAccessRole,
  SESSION_COOKIE_HEADER,
} from "@/lib/api/cookies";
import { mapChurch, mapUser } from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { Church, Role, User } from "@/lib/types";

export const SESSION_COOKIE = "gundala_at";

/**
 * The role the access cookie claims, read locally.
 *
 * A page uses this to decide which requests to *start*, so a Church Admin does
 * not also fire the two staff-only calls (and a staff member the three
 * admin-only ones) purely to discard them as 403 a second later — five requests
 * to the API where three were wanted, all of them contending for the same
 * instance. What is actually rendered still comes from `getSession()`, and Nest
 * re-authorises every one of these calls regardless, so a forged claim here
 * buys nothing but a wasted request.
 *
 * Returns null when the cookie is missing or unreadable; callers should then
 * fall back to starting whatever they might need.
 */
export const peekRole = cache(async (): Promise<Role | null> => {
  const store = await cookies();
  let token = store.get(ACCESS_COOKIE)?.value;
  try {
    // Middleware may have rotated the cookie for this very request; its value
    // arrives on a header, and the store still holds the spent one.
    const forwarded = (await headers()).get(SESSION_COOKIE_HEADER);
    if (forwarded) {
      const rotated = parseCookieHeader(forwarded).get(ACCESS_COOKIE);
      if (rotated) token = rotated;
    }
  } catch {
    // headers() is unavailable outside a request.
  }
  const role = peekAccessRole(token);
  return role === "SUPER_ADMIN" || role === "CHURCH_ADMIN" || role === "CHURCH_STAFF"
    ? role
    : null;
});

export interface Session {
  currentUser: User;
  currentRole: Role;
  /** null for platform-level users (Super Admin). */
  currentChurch: Church | null;
  /** Parishes this Church Admin may open. Empty for Super Admin. */
  assignedChurches: Church[];
  permissions: string[];
  mustChangePassword: boolean;
}

interface AuthMe {
  user: Record<string, unknown>;
  church: Record<string, unknown> | null;
  churches?: Record<string, unknown>[];
  csrfToken?: string;
  mustChangePassword?: boolean;
}

/**
 * One session load per RSC/action request.
 *
 * Layout, page guards, and services all call this. Without `cache()`, each
 * call hits Nest `/auth/me` again. Permissions from `/authorization/context`
 * are unused by the UI, so session is a single `/auth/me` per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!(await hasSessionCookie())) {
    return null;
  }

  try {
    // `/authorization/context` is unused by the UI today — skipping it saves
    // one Singapore RTT on every authenticated RSC. Role comes from /auth/me.
    const me = await apiGet<AuthMe>("/auth/me");
    if (!me?.user) return null;

    const role = (me.user.role as Role) || "CHURCH_STAFF";
    const user = mapUser({
      ...me.user,
      churchId: me.church ? (me.church as { id?: string }).id ?? null : null,
      isActive: true,
    });

    const church: Church | null = me.church ? mapChurch(me.church as Record<string, unknown>) : null;
    const assignedChurches = Array.isArray(me.churches)
      ? me.churches.map((row) => mapChurch(row))
      : church
        ? [church]
        : [];

    return {
      currentUser: user,
      currentRole: role,
      currentChurch: church,
      assignedChurches,
      permissions: [],
      mustChangePassword: Boolean(me.mustChangePassword),
    };
  } catch (error) {
    if (error instanceof ApiError && error.code === "PASSWORD_CHANGE_REQUIRED") {
      throw error;
    }
    if (error instanceof ApiError && (error.isUnauthorized || error.isForbidden)) {
      return null;
    }
    throw error;
  }
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("NO_SESSION");
  return session;
}

export function landingRouteForRole(role: Role): string {
  if (role === "SUPER_ADMIN") return "/super-admin";
  if (role === "CHURCH_ADMIN") return "/intentions/new";
  return "/dashboard";
}

export function isChurchRole(role: Role): boolean {
  return role === "CHURCH_ADMIN" || role === "CHURCH_STAFF";
}
