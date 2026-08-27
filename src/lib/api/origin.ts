/**
 * Nest global prefix. Callers pass paths relative to this (`/setup/super-admin`).
 * The origin env vars must be host-only; if they already include /api/v1, it is stripped.
 */
export const API_PREFIX = "/api/v1";

export function apiOrigin(): string {
  const raw = (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001"
  ).trim();
  return raw.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

export function withApiPrefix(path: string): string {
  let suffix = path.startsWith("/") ? path : `/${path}`;
  const prefixed = suffix.toLowerCase();
  if (prefixed === API_PREFIX || prefixed.startsWith(`${API_PREFIX}/`)) {
    suffix = suffix.slice(API_PREFIX.length) || "/";
  }
  return `${apiOrigin()}${API_PREFIX}${suffix}`;
}
