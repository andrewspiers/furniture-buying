# Business Requirements

## Purpose

A furniture shop needs a simple internal tool for buyers: browse what's
available, place orders, and stay within an agreed spending budget. Built
as a Day 1 hackathon project — scoped deliberately small to be finished
in one day, with room to grow afterwards.

## Users

- **Buyer** — a shop employee who logs in, browses the catalogue, and
  places orders against their own budget. This is the only user role in
  the current scope; there is no separate admin/manager role.

## Functional requirements

### Login
- A buyer must log in before using the app.
- Credentials are a fixed, pre-provisioned email + password — there is
  no public sign-up flow.

### Browse the catalogue
- A buyer can see the full list of available furniture products.
- Each product shows its category, name, and price.
- The catalogue is the furniture shop's own real product data, fetched
  live from the shop's catalogue API (specifically its lightweight
  browsing/search endpoint — the full-detail endpoint is much slower and
  isn't used for this) — not a copy kept in this app's own database.

### Place an order
- A buyer can select quantities of one or more products and submit them
  together as a single order.
- The order's total cost is calculated automatically from product
  prices at the time of purchase.

### Stay within budget
- The buyer's spendable balance is not tracked internally — it's the
  real, live balance from the furniture shop's own API (the Cognitivo
  training platform), which is the source of truth for how much the
  buyer actually has to spend.
- An order that would exceed that real balance must be **prevented**,
  not merely flagged — it should not be possible to place an order the
  buyer can't afford.
- The buyer should be able to see their real balance at all times while
  browsing and ordering.
- Note: orders placed in this app currently only affect this app's own
  order history — they are not sent to the furniture shop API, so
  placing an order here does not deduct from the real balance shown.
  Whether that should change (i.e. orders here actually spend real
  balance) is an open question — see below.

### Order history
- A buyer can view their past orders: what was ordered, when, and how
  much it cost.
- The buyer can see a running summary of what they've spent through
  this app, alongside their current real balance.

## Non-functional requirements

- **Speed of delivery over polish** — this is a one-day build. Simplicity
  and working software take priority over scalability, extensibility, or
  production hardening.
- **No coding background on the business side** — the tool must be
  runnable and understandable by someone who isn't a developer, with
  setup reduced to a small number of documented commands.
- **Single-tenant** — one shop, one shared catalogue. No requirement for
  supporting multiple shops or organizations.

## Explicitly out of scope (Day 1)

These were considered and deliberately deferred, not overlooked:

- Payments or checkout integration (orders are recorded, not paid for
  online).
- An admin/manager view for managing the catalogue or users.
- Public self-signup, password reset, or email verification.
- Multiple buyer roles or approval workflows (e.g. a manager approving
  an order before it's placed).
- Orders placed in this app actually deducting from the buyer's real
  balance (see the note under "Stay within budget" above).

## Open questions for future scope

Not required for Day 1, but worth revisiting if the project continues:

- Should orders placed in this app call through to the real furniture
  shop API (`POST /orders`) so they actually affect the buyer's real
  balance, instead of only being recorded in this app's own history?
- Does an order ever need to be edited or cancelled after being placed?
- Should there be a role that can add/edit/remove products without going
  directly into the database?
- Is a shared/team balance needed, as opposed to one balance per buyer?
