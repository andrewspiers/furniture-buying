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
- Product catalogue: category/name/price for every product, fetched live
  from the Cognitivo furniture shop API (not our own database — see
  "Live catalogue & balance" below)
- Place an order: add items to an order/cart
- Budget tracking: the app shows the buyer's real balance (fetched live from
  the Cognitivo training API, not tracked in our own database) and prevents
  orders that would exceed it
- Order history: see past orders (placed through this app; separate from
  the real external balance/ledger — see "Live catalogue & balance" below)

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
  script, not part of the running app, not required to run the app) to
  optionally pre-populate the local `Product` table from an external
  MongoDB collection — see "Live catalogue & balance" below for why that
  table still exists even though the app displays a live catalogue.

## Running the app
```
cp .env.example .env  # first time only
npm install            # first time only
npm run db:seed        # first time only — creates dev.db with demo user
npm run dev             # starts the app at http://localhost:3000
```
Demo login: `buyer@example.com` / `password123`.

The database is the file `prisma/dev.db`. To wipe it and start over, delete
that file, then run the migrate + seed commands again:
```
npx prisma migrate dev
npm run db:seed
```

## Live catalogue & balance (Cognitivo API)
The catalogue browsing page and the "your balance" figure both come live
from the Cognitivo training API, not from our own database — see
`lib/cognitivoApi.ts`. Credentials (`COGNITIVO_BASE_URL` /
`COGNITIVO_API_KEY` / `COGNITIVO_USERNAME`) live in `.env` only, never
committed.

- **Browsing** uses `GET /catalogue/search-index` (`getSearchIndexProducts()`)
  — a lightweight listing endpoint meant for exactly this, returning
  category/name/price for every product with no images. **Do not** use the
  plain `GET /catalogue` endpoint for browsing: it returns full images for
  every product and has been observed to hang indefinitely (see the
  Gotchas below and `api-testing/get-catalogue.sh`, which needs
  `--max-time` to avoid hanging forever).
- **Balance** uses `GET /users/{user_id}` (`getRealBalance()`), checked
  both when displaying the balance and, authoritatively, when an order is
  placed.

Both pages that call these (`app/catalogue/page.tsx`, `app/orders/page.tsx`)
degrade to a visible error state rather than crashing if the API call
fails, and `ProductCatalogue.tsx` blocks ordering (rather than guessing)
if the balance couldn't be loaded.

**Why Prisma's `Product` table still exists**: `OrderItem` has a foreign
key to a local `Product` row (Prisma/SQLite enforce this at the DB level),
so placing an order still needs a matching local row — `app/api/orders/route.ts`
looks one up by `sourceId` (the Cognitivo `item_id`) and creates it on the
fly from the live catalogue entry if it's missing, rather than failing the
order. `prisma/import-catalog.ts` (pulls the same catalogue from a MongoDB
collection into this table) still works as an optional way to pre-populate
these rows, but the app no longer reads from this table to *display* the
catalogue — only to satisfy that foreign key. `User.budget` is now
vestigial for the same reason `Product.image`/`imageMimeType`/`imageUrl`
are — nothing displays them anymore, but the columns weren't dropped
without asking, since schema changes are hard to reverse.

Orders placed through this app are **not** sent to the Cognitivo API's own
`POST /orders` — they only write to our local `Order`/`OrderItem` tables.
That means "Spent through this app" (shown on the orders page) and "Your
balance" (live, external) are two independent numbers; placing an order
here does not move the real balance. If that's not the intended behavior,
say so — wiring order placement through to the real ledger is a separate,
larger change than showing the balance/catalogue live.

## Folder structure
- `app/` — pages (`login`, `catalogue`, `orders`) and API routes (`app/api`)
- `components/` — shared UI (NavBar) and client-side views that render
  react-bootstrap (ProductCatalogue, OrdersView)
- `lib/` — `db.ts` (Prisma client), `auth.ts` (NextAuth config),
  `cognitivoApi.ts` (live catalogue + balance lookups)
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
- **The Cognitivo balance endpoint (`GET /users/{user_id}`) can be slow**
  (observed several seconds, occasionally longer) since it's derived by
  summing ledger entries rather than a stored field. `getRealBalance()`
  uses a 15s timeout and both pages that call it degrade to a visible
  "balance unavailable" state instead of crashing if it fails — ordering
  is blocked (not silently allowed) when the balance can't be fetched.
  Some other endpoints on this API (e.g. plain `GET /catalogue`, as
  opposed to `/catalogue/search-index`) have been observed hanging
  indefinitely rather than erroring — always curl with `--max-time` when
  testing a new endpoint on this API (see `api-testing/`).
- **Switching the catalogue display to live `search-index` data broke
  order placement** until the API route was updated to match: the
  product identifier changed from our own Prisma `Product.id` (a cuid)
  to the Cognitivo `item_id` (e.g. `"00368814"`), but `OrderItem` still
  has a foreign key to a local `Product` row. Fixed by resolving
  `item_id` -> local `Product` via the `sourceId` column (already
  populated for everything pulled in by `import-catalog.ts`), creating
  the local row on the fly for anything missing one.

# Progress reports.
in CLAUDE-PROGRESS.md write a 100 word or less progress report every 10 minutes. 2 newlines between each report.
Include a local date and time with each report.
Check that file each time to see if it is time for another report.