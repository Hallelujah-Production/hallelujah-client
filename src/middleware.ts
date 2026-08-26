import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  applyParsedCookies,
  CSRF_COOKIE,
  CSRF_HEADER,
  parseSetCookie,
  readSetCookies,
  REFRESH_COOKIE,
} from "@/lib/api/cookies";

function apiOrigin(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

/**
 * When the access cookie has expired, rotate the session before the page
 * renders. Server Components cannot persist Set-Cookie; middleware can.
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
    const upstream = await fetch(`${apiOrigin()}/api/v1/auth/refresh`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
    const response = NextResponse.next();
    const parsed = readSetCookies(upstream.headers)
      .map(parseSetCookie)
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
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
