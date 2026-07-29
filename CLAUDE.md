# Furniture Buying App

## What this is
A Day 1 hackathon project: a web app for a furniture shop's buyers. A user
logs in, browses a product catalogue, and places orders — with the app
tracking spend against a set budget so they can't overspend.

## Who it's for
The account holder ("the user") has no coding background. Claude Code is
responsible for choosing the tech stack, writing the code, and explaining
decisions in plain English. Prioritize working software over best practices
the user would have to maintain themselves.

## Core features (Day 1 scope)
- Login (single user or a small fixed set of users — no self-signup needed)
- Product catalogue: list of furniture items with name, price, image, description
- Place an order: add items to an order/cart
- Budget tracking: user has a budget; the app shows remaining budget and
  prevents (or warns on) orders that would exceed it
- Order history: see past orders

## Explicitly out of scope for Day 1
- Payments/checkout integration
- Multi-tenant/admin dashboards
- Public signup, password reset flows, email verification

## Tech stack
- **Next.js** (App Router) — one framework for both the pages the user sees
  and the backend logic (API routes), instead of running two separate apps.
- **TypeScript** — adds type-checking to catch mistakes early during
  development. No impact on how the user runs the app.
- **Bootstrap** for styling — CSS classes for layout/look. Any *interactive*
  widgets (modals, dropdowns, navbar toggles) use `react-bootstrap` instead
  of vanilla Bootstrap JS, since Bootstrap's own JS manipulates the page in
  a way that conflicts with how React manages it. Plain Bootstrap CSS
  classes have no such conflict and are used freely.
- **SQLite** — the whole database is a single file in the project folder.
  No separate database server to install or run.
- **Prisma** — describes the data shape (User, Product, Order) in plain
  terms and generates the database code, instead of hand-writing SQL.
- **NextAuth.js (Auth.js)**, Credentials provider — login/session handling
  via a well-tested library rather than custom-built auth.
- **MongoDB driver**, used only by `prisma/import-catalog.ts` (a one-off
  script, not part of the running app) to pull the real product catalogue
  from an external MongoDB collection into our own SQLite database.

## Running the app
```
cp .env.example .env  # first time only
npm install            # first time only
npm run db:seed        # first time only — creates dev.db with demo user
npm run dev             # starts the app at http://localhost:3000
```
Demo login: `buyer@example.com` / `password123` (budget: $2000).

The database is the file `prisma/dev.db`. To wipe it and start over, delete
that file, then run the migrate + seed commands again:
```
npx prisma migrate dev
npm run db:seed
```

## Product catalogue data source
The catalogue (764 products) is imported from a MongoDB collection, not
hand-written — see `prisma/import-catalog.ts`. Set `MONGODB_URI` in `.env`
(real credentials go in `.env`, never in `.env.example` or any committed
file) and run:
```
npm run db:import-catalog
```
This upserts products keyed by their source `item_id` (safe to re-run) and
removes the old hand-written placeholder products — except any that are
already referenced by a real order, which are kept so order history stays
accurate. Product photos are stored as raw bytes in the `image` column
(not external URLs) and served through `app/api/products/[id]/image/route.ts`;
the catalogue listing query deliberately excludes that column (`select`,
not the full row) so browsing the catalogue doesn't pull ~70MB of image
data on every page load.

## Folder structure
- `app/` — pages (`login`, `catalogue`, `orders`) and API routes (`app/api`)
- `components/` — shared UI (NavBar) and client-side views that render
  react-bootstrap (ProductCatalogue, OrdersView)
- `lib/` — `db.ts` (Prisma client), `auth.ts` (NextAuth config),
  `budget.ts` (remaining-budget calculation)
- `prisma/` — `schema.prisma` (data shape), `seed.ts` (demo user),
  `import-catalog.ts` (pulls real products from MongoDB)
- `proxy.ts` — route protection (redirects logged-out users to `/login`);
  Next.js 16.2's renamed version of the old `middleware.ts` convention

## Working conventions
- No coding background on the user's side — explain choices in plain
  English before implementing them, especially anything hard to reverse
  (schema changes, new dependencies, deployment).
- Favor the simplest option that works over the "industry standard" option,
  since this is a one-day build with a single non-technical maintainer.

## Gotchas hit during the build
- **react-bootstrap components must render from a Client Component**, not
  directly inside a Server Component (`app/*/page.tsx` without `"use client"`)
  — doing so throws "Element type is invalid". Fetch data in the server
  page, then pass it as props into a small client component that does the
  actual rendering (see `ProductCatalogue.tsx` / `OrdersView.tsx`).
- **Prisma 7 changed schema config** (datasource `url` no longer allowed
  directly in `schema.prisma`); this project pins **Prisma 6**, which keeps
  the simpler, more commonly-documented schema style.
- Node.js is installed via `nvm` into `~/.nvm`, with `node`/`npm`/`npx`
  symlinked into `~/.local/bin` so they're on PATH in every shell
  (plain `.bashrc`-sourced `nvm` only loads in interactive shells).
- **`router.push("/orders")` immediately followed by `router.refresh()`**
  in `ProductCatalogue.tsx` was racy in dev mode with a 764-row catalogue —
  the client-side navigation would sometimes silently lose the race and the
  page would stay on `/catalogue` even though the order was created
  successfully server-side. Fixed by using `window.location.href = "/orders"`
  (a full navigation) after a successful order instead.
- **`toLocaleString()` without an explicit locale/timezone** caused a
  hydration mismatch on the orders page (server renders in one locale and
  timezone, browser in another). Fixed by passing an explicit locale
  (`"en-US"`) and `timeZone: "UTC"` in `OrdersView.tsx` so server and
  client always render identical text.

# Progress reports.
in CLAUDE-PROGRESS.md write a 100 word or less progress report every 10 minutes. 2 newlines between each report.
Include a local date and time with each report.
Check that file each time to see if it is time for another report.