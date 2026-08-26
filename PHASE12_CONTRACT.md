# Phase 12 contract mapping

Frontend mock contracts vs NestJS `/api/v1`. Adapters in `src/lib/api` and `src/lib/services` implement this map. The UI keeps its existing types (`amount` in rupees, `transactionId`, `isRead`, `Paginated` at the top level).

## Envelope

| Frontend (after adapter) | Backend |
|---|---|
| `{ data, page, limit, total, totalPages }` | `{ success: true, data, meta: { page, limit, total, totalPages } }` |
| thrown `ApiError` | `{ success: false, error: { code, message, fields? } }` |

## Auth

| Frontend (old mock) | Backend |
|---|---|
| Cookie `gundala_session` = user id | HttpOnly `gundala_at` + `gundala_rt` + readable `gundala_csrf` |
| Password `demo1234` | First Super Admin is created at `/setup/super-admin`. Optional local demo: `npm run seed:dev` |
| No CSRF | `X-CSRF-Token` must match `gundala_csrf` on POST/PATCH/DELETE when a session cookie is present |
| `GET` mock user | `GET /auth/me` + `GET /authorization/context` + `GET /settings/church` for church users |

The Next.js app is a BFF: Server Actions call NestJS and copy `Set-Cookie` onto the Next origin. The refresh cookie is stored at `Path=/` on the frontend origin so middleware can rotate an expired access cookie. NestJS still *issues* it at `/api/v1/auth`.

## Money

Backend: BIGINT paise (`amountPaise`). Frontend display: integer rupees via `Math.trunc(paise / 100)` into the existing `formatCurrency`. No float arithmetic for totals — reports use backend aggregates.

## Field names

| UI / mock | API |
|---|---|
| `amount` | `amountPaise` |
| `transactionId` | `transactionReference` |
| `sort` | `sortBy` + `sortOrder` |
| `minAmount` / `maxAmount` | `minAmountPaise` / `maxAmountPaise` |
| `isRead` | `readAt` |
| `Receipt.reference` | `receiptNumber` |
| `PrayerType.suggestedAmount` | `defaultAmountPaise` / church `amountPaise` |
| `Church.featured` | `isFeatured` / `featured` |
| Payment proof object | `hasProof` + `GET /payments/:id/proof-url` (ephemeral) |

## Intention source

Both sides use `PUBLIC` \| `STAFF`. Public `POST /public/intentions` **rejects** a payment subsection. Office `POST /intentions` **requires** `payment: { method, transactionReference? }` with amount taken from church pricing.

## Pagination / search

All lists: `page` (default 20, max 100), `limit`, `search`, `from`, `to`. Frontend must not download-then-filter.

## Reports

UI presets `daily` / `weekly` / `monthly` / `custom` map to `today` / `this_week` / `this_month` / `custom`. Backend timezone `Asia/Kolkata`, max 366 inclusive days. Totals come from `/reports/*` (or `/admin/reports/*`), never from summing list rows.

## URLs

Existing Next routes are unchanged (`/super-admin/*` stays; it is not redesigned to `/admin/*`). API paths use `/api/v1/admin/...`. Church Admin/Staff URLs never carry `churchId`.

## Known gaps (not invented)

- No public platform-stats endpoint — landing church counts come from `GET /public/churches`.
- No HTTP list for audit logs — Super Admin audit page shows an empty, honest state.
- Notification list has no `unread` query; unread tab filters the current newest page (API sorts `createdAt` desc).
