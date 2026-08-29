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
/** Middleware → BFF: rotated Cookie header for the current request (RSC cannot persist Set-Cookie). */
export const SESSION_COOKIE_HEADER = "x-gundala-cookie";

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

/** Rebuild a Cookie header after an upstream refresh so the continuing request sees new tokens. */
export function cookieHeaderFromEntries(entries: Iterable<[string, string]>): string {
  return [...entries]
    .filter(([, value]) => value.length > 0)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export function mergeRequestCookies(
  current: Iterable<{ name: string; value: string }>,
  incoming: ParsedCookie[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const cookie of current) map.set(cookie.name, cookie.value);
  for (const cookie of incoming) {
    if (!cookie.value) map.delete(cookie.name);
    else map.set(cookie.name, cookie.value);
  }
  return map;
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

export function parseCookieHeader(raw: string | null | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!raw) return map;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1));
  }
  return map;
}

export function serializeCookieMap(map: Map<string, string>): string {
  return [...map]
    .filter(([, value]) => value.length > 0)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export function applyParsedToCookieMap(map: Map<string, string>, incoming: ParsedCookie[]): void {
  for (const cookie of incoming) {
    if (!cookie.value) map.delete(cookie.name);
    else map.set(cookie.name, cookie.value);
  }
}

/** True when the access JWT is missing, malformed, or past `exp`. Does not verify the signature. */
export function isAccessJwtExpired(token: string | undefined, skewMs = 0): boolean {
  if (!token) return true;
  const parts = token.split(".");
  if (parts.length < 2) return true;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const payload = JSON.parse(atob(padded + pad)) as { exp?: unknown };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return true;
  }
}
