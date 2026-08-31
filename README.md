# Growth Dashboard

Small dashboard for the Vision Ecommerce practical challenge. It pulls carts
and products from dummyjson.com, treats carts as paid orders of a DTC store,
and computes the metrics a recurrence business actually runs on.

Stack: Next.js (App Router) + TypeScript, deployed on Vercel. No chart or UI
library - the data is small and every dependency is a maintenance cost.

## Why these metrics

The job posting talks about recurrence, retention and margin, so the hero
metric is the share of returning customers (customers with more than one
order), not vanity totals. Revenue, order count and AOV support it, revenue by
category shows where the money comes from, and orders per month gives the time
dimension when the source data carries dates.

## Decisions worth explaining

- Mock API: the challenge allows any mock. fakestoreapi.com was the first
  pick, but it blocks server-side/datacenter traffic with a 403 (confirmed
  both from this environment and from the deployed Vercel function) - the
  kind of silent integration break the job description itself points at.
  Switched to dummyjson.com, which has the same shape of data (products,
  carts, users) and no such block.
- Revenue uses each line's discounted total, not the list price. dummyjson
  returns both `total` (pre-discount) and `discountedTotal` (what the
  customer actually paid) per cart item. Every metric - revenue, category
  breakdown, top products - is built on `discountedTotal`, so the category
  and product breakdowns always sum back to the same revenue figure shown at
  the top. Using the list price anywhere would make the numbers disagree
  with each other, which is worse than a wrong number: it looks like a bug
  in the pipeline instead of a data choice.
- Category is joined from `/products`, not read off the cart: dummyjson cart
  items don't carry a category field, only `/products` does. `lib/api.ts`
  fetches both and joins by product id, and falls back to "uncategorized"
  for an id missing from the catalog rather than dropping the line.
- Loud failure: if the API is down, the page renders an explicit error state.
  A dashboard that silently shows zeros is worse than one that says it is
  broken.
- Pure metric functions: lib/metrics.ts has no fetching and no framework, so
  the same logic can move to a cron job, an API route or a test suite without
  changes. Verified with hand-written test cases against both a normal
  dataset and edge cases (unknown product id, API failure).
- Server-side fetch with 5 minute revalidation: keeps the free public API from
  being hit on every page view and keeps tokens/keys off the client (none are
  needed here, but the habit matters).

## What changes with real data

With a real source (Shopify + Checkout Champ events in Postgres/Supabase) the
same page would compute cohort retention instead of a flat returning share,
LTV per acquisition channel from UTM data, and churn per subscription cycle.
The mock has 50 carts and 200 users, so the numbers here demonstrate the
pipeline, not a business conclusion.

## Run it

```
npm install
npm run dev
```
