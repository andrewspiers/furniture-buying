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
- Each product shows a name, description, category, price, and image.

### Place an order
- A buyer can select quantities of one or more products and submit them
  together as a single order.
- The order's total cost is calculated automatically from product
  prices at the time of purchase.

### Stay within budget
- Each buyer has a fixed budget.
- The app tracks how much of that budget has been spent (across all of
  a buyer's past orders) and how much remains.
- An order that would exceed the buyer's remaining budget must be
  **prevented**, not merely flagged — it should not be possible to place
  an order the buyer can't afford.
- The buyer should be able to see their remaining budget at all times
  while browsing and ordering.

### Order history
- A buyer can view their past orders: what was ordered, when, and how
  much it cost.
- The buyer can see a running summary of total spend vs. budget vs.
  remaining.

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
- An admin/manager view for managing the catalogue, budgets, or users.
- Public self-signup, password reset, or email verification.
- Budget periods or resets (e.g. a monthly budget that refills) — budget
  is currently a single fixed lifetime amount per buyer.
- Multiple buyer roles or approval workflows (e.g. a manager approving
  an order before it's placed).

## Open questions for future scope

Not required for Day 1, but worth revisiting if the project continues:

- Should budgets reset on a schedule (monthly/quarterly) rather than
  being a single lifetime figure?
- Does an order ever need to be edited or cancelled after being placed?
- Should there be a role that can add/edit/remove products, or set/adjust
  a buyer's budget, without going directly into the database?
- Is a shared/team budget needed, as opposed to one budget per buyer?
