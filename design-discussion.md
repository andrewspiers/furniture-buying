# Furniture Shop API as AI Agent Tools

Proposed tool wrappers around the Cognitivo furniture shop API's four
actions, for use by an AI agent. Each entry gives a name, a one-sentence
description written to tell the agent *when* to use it, and the honesty
caveats that description needs to carry given what the underlying API
actually does (and doesn't do).

## 1. `search_furniture_catalogue`

> Lists furniture products, optionally filtered to one exact category
> (e.g. `"Bar furniture"`, `"Beds"`) — use this to browse or answer
> "what's in category X," not to find items by price, colour, name
> keyword, or style/vibe, since the API only supports exact category
> filtering and returns no images.

**Honesty notes:**
- The *only* filter is `category`, and it's an **exact string match**
  against a fixed list (from `GET /catalogue/categories`) — no
  partial/fuzzy match, no price range, no colour filter, no free-text
  search on product name at all. An agent asked for "cheap blue chairs
  under $100" cannot do that server-side; it would have to fetch
  everything (or the relevant category) and filter client-side itself.
- No images or descriptions come back — just category/name/price/
  dimensions/colours-as-list. If a task needs a product photo, this is
  the wrong tool (see #2).

## 2. `get_furniture_product`

> Fetches full details — including a photo — for one specific product,
> given its exact `item_id`; you must already have that id (e.g. from a
> prior catalogue search), since this endpoint can't search or look up
> by name.

**Honesty notes:**
- Pure lookup by opaque id, not discovery. If the agent only has a
  product name, it must call the search tool first to resolve the id.
- Noticeably heavier/slower than the catalogue search (full image
  payload per call) — don't use it to fetch many products in a loop;
  use catalogue search for listings.

## 3. `check_furniture_balance`

> Returns the buyer's current real spendable balance — call this before
> proposing anything at or near their budget limit, since it reflects
> live account state, not something safe to assume or cache.

**Honesty notes:**
- Can be genuinely slow (observed several seconds, worst case ~13s in
  testing) — it's computed by summing ledger entries on request, not
  read from a stored field. An agent chaining several tool calls should
  expect this one to be the long pole.
- It only reports a number — it does not itself prevent overspending.
  Enforcing "don't exceed balance" is the agent's/caller's job before
  calling the order tool, not something this tool does for you.

## 4. `place_furniture_order`

> Places a real order for one or more items by `item_id` and quantity,
> and **immediately and irreversibly debits the buyer's real balance** —
> this is a payment action, not a cart draft, so only call it once the
> agent (or user) has actually confirmed the purchase.

**Honesty notes — this one needs the most caution:**
- Per the API's own description: *"this is also the payment — it debits
  the balance."* There's no separate "confirm" step and no
  cancel/refund endpoint documented. An agent should not call this
  speculatively or as part of exploring options.
- It supports an `Idempotency-Key` header specifically so retries after
  a timeout/dropped connection don't double-charge — any tool wrapper
  around this **should always send one**, since an agent retrying a
  failed call without it risks placing the same order twice.
- Price isn't something the agent supplies or negotiates — it's resolved
  server-side from the current catalogue price at order time, so a
  price the agent saw earlier (especially from a cached search result)
  could be stale by the time it places the order.

## Open question

Whether an API key is scoped so it can *only* ever check/spend its own
account's balance, or whether a malformed/guessed `user_id` alongside a
valid key could touch someone else's, was not verified — a check of this
was flagged by a permission classifier as a cross-user probe and
deliberately not forced. This should be confirmed by whoever owns the
API before treating `check_furniture_balance`/`place_furniture_order` as
safe to expose broadly.
