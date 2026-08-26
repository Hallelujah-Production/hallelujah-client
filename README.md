# Gundala — Church Prayer & Intention Platform (Frontend)

A multi-tenant platform that digitises the prayer intention register a parish
already keeps: the intention, the offering the church received for it, and the
official receipt it issues — in one place, readable by everyone it concerns.

**This phase is frontend only.** There is no backend, no database, no
authentication, no file storage and — by design, permanently — no payment
gateway. A mock service layer stands in for the API so the future NestJS +
PostgreSQL backend can replace it without a UI rewrite.

---

## The one thing to understand first

**Gundala is a register, not a payment processor.**

A family pays its parish exactly as it does today — cash at the counter, UPI,
PhonePe, Google Pay, a bank transfer. The platform records *what was paid* so
the parish can reconcile it and issue a receipt. There is no checkout, no card
handling, no redirect, no webhook and no settlement anywhere in the codebase.

This is why "verify payment" is bookkeeping, not capture: the money already
changed hands at the church.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit
```

### Demo accounts

Sign in at `/login`. Every demo account uses the password `demo1234`.

| Role | Email | Lands on |
|---|---|---|
| Super Admin | `elizabeth@gundala.com` | `/super-admin` |
| Church Admin | `admin@st-marys.gundala.com` | `/dashboard` |
| Prayer Staff | `thomas-xavier@st-marys.gundala.com` | `/dashboard` |

The login screen offers one-click fill for each.

Families need no account: any visitor can submit an intention from a church's
public page.

---

## Architecture

```
Next.js UI  →  Service Layer  →  [ NestJS API  →  PostgreSQL ]
                (lib/services)      (not built yet)
```

Only the middle layer changes when the backend lands.

```
src/
  app/
    (public)/          landing, about, churches, church/[slug], prayer form, contact, legal
    login/             mock sign-in
    (app)/             every authenticated screen, behind one shell
      dashboard/       role-aware: admin dashboard or staff dashboard
      intentions/ customers/ payments/ receipts/ team/ reports/ settings/
      my-prayers/ upcoming/ completed/ profile/     (staff)
      notifications/                                 (all roles)
      super-admin/     churches, users, prayer types, reports, audit logs, settings
    actions/           server actions (auth, intentions, team, churches, settings, notifications)
  components/
    ui/                button, form controls, card, badge, dialog, states, image preview
    layout/            app shell, sidebar, header, mobile drawer, tab bar, breadcrumbs
    data/              data table, pagination, search, filters, stat cards, charts
    domain/            receipt, prayer ticket, prayer card, church card, proof uploader, stepper
    marketing/         hero, church finder, how it works, services, trust, contact
  lib/
    types.ts           the domain model
    mock/              seeded dataset + in-memory store  ← the only mutable state
    services/          the seam the API will replace
    session.ts         mock session (currentUser / currentRole / currentChurch)
    guards.ts          route guards
    utils.ts           formatting, dates, query helpers
```

### The service layer is the seam

Components never touch `lib/mock` directly. They call
`getIntentions(churchId, query)`, `verifyMockPayment(...)`, `getDashboardStats(...)`
and receive already-paginated, already-hydrated view models — the same shapes a
REST endpoint will return:

```ts
{ data, page, limit, total, totalPages }
```

No list ships more than one page of rows to the client.

### Multi-tenancy

Every tenant-owned entity carries a `churchId`, and every service query is
scoped by it. The tenant is resolved from the session — never from a query
parameter, and never from a URL segment:

```
gundala.com/dashboard          ✅  tenant comes from the session
gundala.com/dashboard?churchId=123   ❌  never
```

Verified: a St. Mary's administrator requesting a Holy Family intention,
payment, receipt or customer by id gets *not found*, not a redirect — the
record is never loaded.

### Intention lifecycle, kept separate from payment

```
Intention:  CREATED → PAYMENT_PENDING → PAID → ASSIGNED → PENDING_PRAYER
            → IN_PROGRESS → COMPLETED   (or CANCELLED)

Payment:    PENDING_VERIFICATION → VERIFIED | REJECTED
```

Two fields, never merged. Verifying a payment moves the intention forward;
rejecting it sends the intention back to `PAYMENT_PENDING` with a reason.

### Receipts

A reference is issued once per intention, in the form `CH-2026-000123`, and
stays attached to the intention, the payment and the printed document. The
receipt renders as an A4 office document; the print stylesheet hides the
sidebar, header, navigation and every control so only the receipt reaches the
paper.

---

## Security posture

Nothing in this frontend is a security control, and the code says so where it
matters. What is here is a shape the backend can enforce:

- The session is a cookie holding a user id. It grants nothing; it exists to
  demonstrate role-based navigation.
- Route guards decide what a signed-in user is *shown*. Every service call
  takes its tenant from the session those guards return.
- Server actions re-read the session and derive the tenant themselves; a church
  id is never accepted from the caller.
- A Church Admin cannot create a Super Admin — enforced in the service layer as
  well as the UI.
- Payment proof is validated for type and size, previewed from an in-memory
  object URL, and never rendered from a user-supplied path. SVG is excluded on
  purpose: it can carry script.
- Private routes are `noindex, nofollow` and listed in `robots.ts`.

The backend will own authentication, authorisation, tenant isolation, input
validation, rate limiting, session management, file scanning, signed URLs and
append-only audit logging.

---

## Design system

Semantic tokens only — no hardcoded colours in components. Defined once in
`globals.css` and exposed through `tailwind.config.ts`.

| Role | Value |
|---|---|
| Primary | Deep navy |
| Secondary | Forest green |
| Accent | Warm gold (used sparingly) |
| Background | Warm off-white |
| Surface | White |

Type is Inter for the interface and Plus Jakarta Sans for display, both through
`next/font`. Motion is CSS-only and fully suppressed under
`prefers-reduced-motion`.

Chart colours are a separate, validated concern: the brand hues read as grey at
mark size, so the three series slots are the same hues stepped into the chart
lightness band and checked as a set for colour-vision deficiency, adjacent
separation and contrast. They are assigned in fixed order and never cycled.

---

## What was verified

- Production build clean; `tsc --noEmit` clean.
- All 41 routes reachable; every role landed on its own workspace.
- Role isolation: staff blocked from payments, customers, receipts, team,
  reports, settings and super-admin; church admin blocked from super-admin;
  super admin redirected away from church-scoped routes.
- Tenant isolation across intentions, payments, receipts and customers.
- Cash flow (no transaction id), UPI flow (transaction id required, proof
  attached), field-level validation, receipt issue, uniqueness of references,
  payment verification and rejection, and cross-tenant verification blocked.
- Accessibility sweep across 35 pages: one `h1` each, every control labelled,
  every button and link named, decorative icons hidden.
- Print CSS: A4 page box, application chrome hidden, receipt only.
- SEO: canonical URLs and Open Graph on public pages; `noindex` on private ones;
  dynamic per-church metadata; sitemap and robots.

## What is deliberately absent

No payment gateway. No backend, database, ORM, Redis, queue or object storage.
No real authentication. No network calls of any kind — the only `process.env`
read is the cookie `secure` flag.
