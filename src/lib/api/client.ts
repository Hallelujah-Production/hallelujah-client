import "server-only";

import { cookies } from "next/headers";
import type { Paginated } from "@/lib/types";
import {
  ACCESS_COOKIE,
  applySetCookieHeaders,
  CSRF_COOKIE,
  CSRF_HEADER,
  REFRESH_COOKIE,
} from "./cookies";
import { ApiError } from "./errors";

const API_PREFIX = "/api/v1";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function apiOrigin(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${apiOrigin()}${API_PREFIX}${suffix}`;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
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

let refreshInFlight: Promise<boolean> | null = null;

function cookieHeader(store: Awaited<ReturnType<typeof cookies>>): string {
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function persistUpstreamCookies(response: Response): Promise<void> {
  try {
    const store = await cookies();
    applySetCookieHeaders(store, response.headers);
  } catch {
    // RSC cannot write cookies. Middleware rotates the session before render.
  }
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const store = await cookies();
    const csrf = store.get(CSRF_COOKIE)?.value;
    const headers: Record<string, string> = {
      cookie: cookieHeader(store),
      accept: "application/json",
    };
    if (csrf) headers[CSRF_HEADER] = csrf;
    const response = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      headers,
      cache: "no-store",
    });
    await persistUpstreamCookies(response);
    return response.ok;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
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
    throw new ApiError(
      status,
      body.error?.code ?? "INTERNAL_ERROR",
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
  const headers: Record<string, string> = {
    accept: "application/json",
    cookie: cookieHeader(store),
  };

  const csrf = store.get(CSRF_COOKIE)?.value;
  if (MUTATING.has(method) && !options.skipCsrf && csrf) {
    headers[CSRF_HEADER] = csrf;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const url = `${apiUrl(path)}${formatQuery(options.query)}`;
  const started = Date.now();
  const init: RequestInit = {
    method,
    headers,
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
    const hasRefresh = Boolean(store.get(REFRESH_COOKIE)?.value || store.get(ACCESS_COOKIE)?.value);
    if (hasRefresh) {
      const ok = await refreshSession();
      if (ok) {
        const retryStore = await cookies();
        const retryHeaders: Record<string, string> = {
          accept: "application/json",
          cookie: cookieHeader(retryStore),
        };
        const retryCsrf = retryStore.get(CSRF_COOKIE)?.value;
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
