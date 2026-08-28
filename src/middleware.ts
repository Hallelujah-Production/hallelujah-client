import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  applyParsedCookies,
  cookieHeaderFromEntries,
  CSRF_COOKIE,
  CSRF_HEADER,
  mergeRequestCookies,
  parseSetCookie,
  readSetCookies,
  REFRESH_COOKIE,
} from "@/lib/api/cookies";
import { withApiPrefix } from "@/lib/api/origin";

/**
 * Concurrent document requests can all notice an expired access cookie at once.
 * Share one refresh per refresh-token value inside this isolate so rotation
 * does not look like reuse.
 */
const refreshInFlight = new Map<string, Promise<Response>>();

function refreshOnce(refreshToken: string, run: () => Promise<Response>): Promise<Response> {
  const existing = refreshInFlight.get(refreshToken);
  if (existing) return existing;
  const pending = run().finally(() => {
    refreshInFlight.delete(refreshToken);
  });
  refreshInFlight.set(refreshToken, pending);
  return pending;
}

/**
 * When the access cookie has expired, rotate the session before the page
 * renders. Server Components cannot persist Set-Cookie; middleware can.
 *
 * New cookies are copied onto both the browser response AND the continuing
 * request. Without that, RSC still sees the old Cookie header, the BFF
 * refreshes again with the spent token, reuse detection fires, and the user
 * is signed out.
 */
export async function middleware(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (access || !refresh) return NextResponse.next();

  const csrf = request.cookies.get(CSRF_COOKIE)?.value;
  const headers: Record<string, string> = {
    cookie: request.headers.get("cookie") ?? "",
    accept: "application/json",
  };
  if (csrf) headers[CSRF_HEADER] = csrf;

  try {
    const upstream = await refreshOnce(refresh, () =>
      fetch(withApiPrefix("/auth/refresh"), {
        method: "POST",
        headers,
        cache: "no-store",
      }),
    );

    const parsed = readSetCookies(upstream.headers)
      .map(parseSetCookie)
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    const requestCookies = mergeRequestCookies(request.cookies.getAll(), parsed);
    if (!upstream.ok) {
      requestCookies.delete(ACCESS_COOKIE);
      requestCookies.delete(REFRESH_COOKIE);
      requestCookies.delete(CSRF_COOKIE);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("cookie", cookieHeaderFromEntries(requestCookies));

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    applyParsedCookies(response.cookies, parsed);
    if (!upstream.ok) {
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      response.cookies.delete(CSRF_COOKIE);
    }
    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
