/**
 * Copy NestJS Set-Cookie headers onto the Next.js cookie jar.
 *
 * The refresh cookie is issued with Path=/api/v1/auth on the API origin. This
 * BFF stores it at Path=/ so middleware and Server Actions can rotate the
 * session. The token is still HttpOnly; JavaScript never reads it.
 */
export const ACCESS_COOKIE = "gundala_at";
export const REFRESH_COOKIE = "gundala_rt";
export const CSRF_COOKIE = "gundala_csrf";
export const CSRF_HEADER = "X-CSRF-Token";

export interface ParsedCookie {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  maxAge?: number;
  expires?: Date;
}

export function parseSetCookie(header: string): ParsedCookie | null {
  const parts = header.split(";").map((p) => p.trim());
  const first = parts.shift();
  if (!first) return null;
  const eq = first.indexOf("=");
  if (eq <= 0) return null;
  const name = first.slice(0, eq).trim();
  const value = first.slice(eq + 1);
  const cookie: ParsedCookie = { name, value };

  for (const part of parts) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey.trim().toLowerCase();
    const val = rest.join("=").trim();
    if (key === "httponly") cookie.httpOnly = true;
    else if (key === "secure") cookie.secure = true;
    else if (key === "path") cookie.path = val || "/";
    else if (key === "samesite") {
      const s = val.toLowerCase();
      if (s === "lax" || s === "strict" || s === "none") cookie.sameSite = s;
    } else if (key === "max-age") {
      const n = Number(val);
      if (Number.isFinite(n)) cookie.maxAge = n;
    } else if (key === "expires") {
      const d = new Date(val);
      if (!Number.isNaN(d.getTime())) cookie.expires = d;
    }
  }

  if (cookie.name === REFRESH_COOKIE) cookie.path = "/";
  if (!cookie.path) cookie.path = "/";
  return cookie;
}

export function readSetCookies(headers: Headers): string[] {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === "function") {
    return getSetCookie.call(headers);
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

type CookieJar = {
  set: (
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      path?: string;
      sameSite?: "lax" | "strict" | "none";
      maxAge?: number;
      expires?: Date;
    },
  ) => void;
};

export function applyParsedCookies(jar: CookieJar, cookies: ParsedCookie[]): void {
  for (const cookie of cookies) {
    jar.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      path: cookie.path ?? "/",
      sameSite: cookie.sameSite ?? "lax",
      maxAge: cookie.maxAge,
      expires: cookie.expires,
    });
  }
}

export function applySetCookieHeaders(jar: CookieJar, headers: Headers): void {
  const parsed = readSetCookies(headers)
    .map(parseSetCookie)
    .filter((c): c is ParsedCookie => Boolean(c));
  applyParsedCookies(jar, parsed);
}
