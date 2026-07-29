# Architecture

This document explains how the pieces of the app fit together. For *why*
these tools were chosen, see [CLAUDE.md](CLAUDE.md); this file is about
*how* they're wired up.

## High-level shape

```
Browser
  │
  │  clicks / form submits
  ▼
Next.js (single app, one process)
  ├─ Pages (Server Components)  — fetch data, render HTML
  ├─ Client Components          — interactive bits (forms, buttons, state)
  ├─ API routes (app/api/*)     — the only place that writes to the database
  ├─ proxy.ts (middleware)      — gate: are you logged in?
  └─ lib/                       — shared logic (auth, db, budget)
        │
        ▼
     Prisma Client
        │
        ▼
  SQLite file (prisma/dev.db)
```

There is no separate backend server or API host — Next.js serves the
HTML, runs the page-load logic, and handles API requests all from one
`npm run dev` process. That's the main simplifying idea behind the stack.

## Server Components vs. Client Components

This is the one distinction that matters most for understanding the code.

- **Server Components** (default in `app/`, e.g. `app/catalogue/page.tsx`,
  `app/orders/page.tsx`) run only on the server. They can talk to Prisma
  directly, read the session, and never ship their code to the browser.
  They're used purely to **fetch data**.
- **Client Components** (files starting with `"use client"`, e.g.
  `components/ProductCatalogue.tsx`, `components/OrdersView.tsx`,
  `components/NavBar.tsx`, `app/login/page.tsx`) run in the browser. They
  hold interactive state (quantity inputs, form fields) and are the only
  place `react-bootstrap` components can be rendered.

The pattern used throughout: a page.tsx **server component** fetches data
with Prisma, then passes it as props into a **client component** that
does the actual rendering with react-bootstrap.

```
app/catalogue/page.tsx (server)          app/orders/page.tsx (server)
  fetch products + budget                  fetch orders + budget
        │                                        │
        ▼                                        ▼
components/ProductCatalogue.tsx (client)  components/OrdersView.tsx (client)
  renders cards, tracks quantities,         renders spend summary,
  submits to /api/orders                    order history table
```

`react-bootstrap` doesn't ship a `"use client"` directive itself — trying
to render it from a Server Component throws "Element type is invalid".
That's why the split exists everywhere react-bootstrap is used.

## Request flow: placing an order

This is the core piece of business logic in the app.

1. User sets quantities in `ProductCatalogue.tsx` (client-side React
   state — nothing hits the server yet). The running total and a
   "remaining budget" figure are shown live, computed in the browser
   from the prices already sent down with the page.
2. Clicking **Place order** sends `POST /api/orders` with
   `{ items: [{ productId, quantity }] }`.
3. `app/api/orders/route.ts` (a server-only API route):
   - Confirms the caller is logged in (`auth()`), rejecting with 401
     otherwise.
   - Re-fetches the *authoritative* product prices from the database —
     it never trusts prices from the browser, only product IDs and
     quantities.
   - Computes the order total server-side.
   - Calls `getBudgetSummary()` (`lib/budget.ts`) to get the user's
     current remaining budget (their `budget` field minus the sum of
     `total` across all their past `Order` rows).
   - If the new total would exceed what's remaining, returns a 400 with
     an error message — no row is written.
   - Otherwise creates one `Order` row plus its `OrderItem` rows
     (snapshotting `unitPrice` at time of purchase) in a single Prisma
     call.
4. The client component redirects to `/orders` and calls
   `router.refresh()`, which re-runs the server component and shows the
   new remaining budget.

The same budget check happens twice, deliberately: once client-side (to
disable the button and give instant feedback) and once server-side (the
one that actually matters — the client-side check is only a UX nicety
and could be bypassed).

## Authentication

- **NextAuth.js (Auth.js) v5**, configured in `lib/auth.ts`, using the
  **Credentials provider** (email + password, no OAuth).
- Passwords are hashed with `bcryptjs` and stored on the `User` row
  (`passwordHash`); `authorize()` compares the submitted password against
  the hash.
- Sessions are JWT-based (no separate session table) — the user's `id`
  is copied into the token in the `jwt` callback, then back into
  `session.user.id` in the `session` callback, since NextAuth doesn't
  include it by default. `types/next-auth.d.ts` extends NextAuth's types
  so `session.user.id` type-checks.
- **`proxy.ts`** (Next.js 16.2's renamed `middleware.ts` convention) runs
  before every page request except `/api/auth/*` and static assets. It
  redirects logged-out users to `/login`, and redirects already-logged-in
  users away from `/login`. `app/page.tsx` (the `/` route) just
  redirects to `/catalogue` — the proxy has already ensured you're
  logged in by the time you get there.
- `components/Providers.tsx` wraps the whole app in NextAuth's
  `SessionProvider` so client components (like `NavBar`) can call
  `useSession()`/`signOut()`.

## Data model

Defined in `prisma/schema.prisma`, four tables:

```
User            Product           Order              OrderItem
──────          ───────           ─────              ─────────
id              id                id                 id
name            name              userId  ──────►    orderId  ──────►
email (unique)  description       total              productId ─────►
passwordHash    price             createdAt           quantity
budget          imageUrl                               unitPrice
orders[]        category
                orderItems[]
```

- `User.budget` is a single fixed total (no time period/reset logic —
  out of scope for Day 1).
- `OrderItem.unitPrice` is a **snapshot** of the product's price at
  purchase time, not a live reference — so past orders stay accurate
  even if a product's price changes later.
- Remaining budget is *derived*, not stored: `budget - sum(orders.total)`.
  Computed on every read in `lib/budget.ts`; there's no risk of it
  drifting out of sync since it's never written directly.
- Migrations live in `prisma/migrations/`; the SQLite file itself
  (`prisma/dev.db`) is git-ignored and regenerated locally with
  `npx prisma migrate dev && npm run db:seed`.

## Directory reference

| Path | Role |
|---|---|
| `app/login/page.tsx` | Client component — login form, calls `signIn()` |
| `app/catalogue/page.tsx` | Server component — fetches products + budget |
| `app/orders/page.tsx` | Server component — fetches order history + budget |
| `app/api/auth/[...nextauth]/route.ts` | Delegates to NextAuth's handlers |
| `app/api/orders/route.ts` | The only route that writes `Order`/`OrderItem` rows |
| `components/ProductCatalogue.tsx` | Client — quantity selection, live total, submits order |
| `components/OrdersView.tsx` | Client — renders order history + budget bar |
| `components/NavBar.tsx` | Client — top nav, shows session user, sign out |
| `components/Providers.tsx` | Client — wraps the app in NextAuth's `SessionProvider` |
| `lib/db.ts` | Shared Prisma client (single instance, reused across hot reloads) |
| `lib/auth.ts` | NextAuth configuration |
| `lib/budget.ts` | `getBudgetSummary()` — the one place remaining budget is computed |
| `prisma/schema.prisma` | Data model |
| `prisma/seed.ts` | Demo user + 8 sample products |
| `proxy.ts` | Route protection (login gate) |

## Deliberate non-features

Reflects the Day 1 hackathon scope in [CLAUDE.md](CLAUDE.md) — not
oversights:

- No persistent server-side cart — quantities live only in the
  catalogue page's React state until "Place order" is clicked.
- No payments/checkout.
- No multi-tenant/admin views, self-signup, or password reset.
- No budget periods/resets — `budget` is a single lifetime figure.
