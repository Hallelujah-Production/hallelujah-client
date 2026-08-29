import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Paginated } from "@/lib/types";
import {
  ACCESS_COOKIE,
  applyParsedToCookieMap,
  applySetCookieHeaders,
  CSRF_COOKIE,
  CSRF_HEADER,
  parseCookieHeader,
  parseSetCookie,
  type ParsedCookie,
  readSetCookies,
  REFRESH_COOKIE,
  serializeCookieMap,
  SESSION_COOKIE_HEADER,
} from "./cookies";
import { ApiError } from "./errors";
import { withApiPrefix } from "./origin";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export function apiUrl(path: string): string {
  return withApiPrefix(path);
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    roleTotals?: Paginated<unknown>["roleTotals"];
    churchTotals?: Paginated<unknown>["churchTotals"];
    paymentStats?: Paginated<unknown>["paymentStats"];
  };
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string> };
}

type Envelope<T> = ApiSuccess<T> | ApiFailure;

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  formData?: FormData;
  skipRefresh?: boolean;
  skipCsrf?: boolean;
  /** Public GETs may be cached briefly. Authenticated traffic is never cached. */
  revalidate?: number;
}

/**
 * One refresh at a time per Node process. Concurrent 401s wait for the same
 * promise so they do not each rotate the same refresh token.
 */
type RefreshResult = { ok: boolean; cookies: ParsedCookie[] };

let refreshInFlight: Promise<RefreshResult> | null = null;

async function cookieMapForRequest(
  store: Awaited<ReturnType<typeof cookies>>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const cookie of store.getAll()) {
    if (cookie.value) map.set(cookie.name, cookie.value);
  }
  try {
    const forwarded = (await headers()).get(SESSION_COOKIE_HEADER);
    if (forwarded) {
      for (const [name, value] of parseCookieHeader(forwarded)) {
        if (value) map.set(name, value);
        else map.delete(name);
      }
    }
  } catch {
    // headers() is unavailable outside a request.
  }
  return map;
}

async function persistUpstreamCookies(response: Response): Promise<void> {
  try {
    const store = await cookies();
    applySetCookieHeaders(store, response.headers);
  } catch {
    // RSC cannot write cookies. Retry uses Set-Cookie from this response directly.
  }
}

function setCookiesFrom(response: Response): ParsedCookie[] {
  return readSetCookies(response.headers)
    .map(parseSetCookie)
    .filter((cookie): cookie is ParsedCookie => Boolean(cookie));
}

async function runRefresh(): Promise<RefreshResult> {
  const store = await cookies();
  const cookieMap = await cookieMapForRequest(store);
  const csrf = cookieMap.get(CSRF_COOKIE);
  const requestHeaders: Record<string, string> = {
    cookie: serializeCookieMap(cookieMap),
    accept: "application/json",
  };
  if (csrf) requestHeaders[CSRF_HEADER] = csrf;

  const response = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    headers: requestHeaders,
    cache: "no-store",
  });
  const rotated = setCookiesFrom(response);
  await persistUpstreamCookies(response);
  return { ok: response.ok, cookies: rotated };
}

function refreshSession(): Promise<RefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = runRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function hasSessionCookie(): Promise<boolean> {
  const store = await cookies();
  const map = await cookieMapForRequest(store);
  return Boolean(map.get(ACCESS_COOKIE) || map.get(REFRESH_COOKIE));
}

function parseEnvelope<T>(status: number, raw: unknown): T {
  if (!raw || typeof raw !== "object") {
    if (status >= 400) {
      throw new ApiError(status, "INTERNAL_ERROR", "Something went wrong. Please try again.");
    }
    return raw as T;
  }
  const body = raw as Envelope<T>;
  if ("success" in body && body.success === false) {
    const code = body.error?.code ?? "INTERNAL_ERROR";
    if (code === "PASSWORD_CHANGE_REQUIRED") {
      redirect("/change-password");
    }
    throw new ApiError(
      status,
      code,
      body.error?.message ?? "Something went wrong. Please try again.",
      body.error?.fields,
    );
  }
  if ("success" in body && body.success === true) {
    return body.data;
  }
  return raw as T;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; message?: string; meta?: ApiSuccess<T>["meta"] }> {
  const store = await cookies();
  const cookieMap = await cookieMapForRequest(store);
  const requestHeaders: Record<string, string> = {
    accept: "application/json",
    cookie: serializeCookieMap(cookieMap),
  };

  const csrf = cookieMap.get(CSRF_COOKIE);
  if (MUTATING.has(method) && !options.skipCsrf && csrf) {
    requestHeaders[CSRF_HEADER] = csrf;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    requestHeaders["content-type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const url = `${apiUrl(path)}${formatQuery(options.query)}`;
  const started = Date.now();
  const init: RequestInit = {
    method,
    headers: requestHeaders,
    body,
    cache: "no-store",
  };
  if (options.revalidate && method === "GET") {
    init.cache = undefined;
    init.next = { revalidate: options.revalidate };
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "We couldn’t reach the server. Check your connection and try again.",
    );
  }
  const isAuthPath = path.startsWith("/auth/login") || path.startsWith("/auth/refresh");

  if (response.status === 401 && !options.skipRefresh && !isAuthPath) {
    if (cookieMap.get(REFRESH_COOKIE) || store.get(REFRESH_COOKIE)?.value) {
      const rotated = await refreshSession();
      if (rotated.ok) {
        applyParsedToCookieMap(cookieMap, rotated.cookies);
        const retryHeaders: Record<string, string> = {
          accept: "application/json",
          cookie: serializeCookieMap(cookieMap),
        };
        const retryCsrf = cookieMap.get(CSRF_COOKIE);
        if (MUTATING.has(method) && !options.skipCsrf && retryCsrf) {
          retryHeaders[CSRF_HEADER] = retryCsrf;
        }
        if (options.body !== undefined && !options.formData) {
          retryHeaders["content-type"] = "application/json";
        }
        response = await fetch(url, {
          ...init,
          headers: retryHeaders,
        });
      }
    }
  }

  await persistUpstreamCookies(response);

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[bff] ${method} ${path} ${Date.now() - started}ms ${response.status}`);
  }

  if (!response.ok) {
    parseEnvelope(response.status, parsed);
    throw new ApiError(
      response.status,
      response.status === 401 ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
      response.status === 401
        ? "You need to sign in to do that."
        : "Something went wrong. Please try again.",
    );
  }

  if (!parsed || typeof parsed !== "object" || !("success" in parsed)) {
    return { data: parsed as T };
  }
  const envelope = parsed as ApiSuccess<T>;
  return { data: envelope.data, message: envelope.message, meta: envelope.meta };
}

function formatQuery(params?: RequestOptions["query"]): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "ALL") continue;
    // Invitation / reset tokens must never appear on an API query string.
    if (key === "token") continue;
    if (key === "limit") {
      const n = Number(value);
      const limit = Number.isFinite(n) ? Math.min(Math.max(1, Math.trunc(n)), 100) : 20;
      search.set(key, String(limit));
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  const { data } = await apiRequest<T>("GET", path, options);
  return data;
}

export async function apiGetPaginated<T>(
  path: string,
  options?: RequestOptions,
): Promise<Paginated<T>> {
  const { data, meta } = await apiRequest<T[]>("GET", path, options);
  return {
    data: Array.isArray(data) ? data : [],
    page: meta?.page ?? 1,
    limit: meta?.limit ?? 20,
    total: meta?.total ?? 0,
    totalPages: meta?.totalPages ?? 1,
    roleTotals: meta?.roleTotals,
    churchTotals: meta?.churchTotals,
    paymentStats: meta?.paymentStats,
  };
}

export async function apiSend<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  options?: RequestOptions,
): Promise<{ data: T; message?: string }> {
  const { data, message } = await apiRequest<T>(method, path, options);
  return { data, message };
}

export async function apiPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiSend<T>("POST", path, { ...options, body });
}

export async function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiSend<T>("PATCH", path, { ...options, body });
}

export async function apiDelete<T>(path: string, options?: RequestOptions) {
  return apiSend<T>("DELETE", path, options);
}

export async function apiUpload<T>(path: string, formData: FormData, options?: RequestOptions) {
  return apiSend<T>("POST", path, { ...options, formData });
}

export function emptyPage<T>(page = 1, limit = 20): Paginated<T> {
  return { data: [], page, limit, total: 0, totalPages: 1 };
}
