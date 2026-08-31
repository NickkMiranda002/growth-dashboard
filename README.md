# Growth Dashboard

Small dashboard for the Vision Ecommerce practical challenge. It pulls carts,
products and users from fakestoreapi.com, treats carts as paid orders of a DTC
store, and computes the metrics a recurrence business actually runs on.

Stack: Next.js (App Router) + TypeScript, deployed on Vercel. No chart or UI
library - the data is small and every dependency is a maintenance cost.

## Why these metrics

The job posting talks about recurrence, retention and margin, so the hero
metric is the share of returning customers (customers with more than one
order), not vanity totals. Revenue, order count and AOV support it, revenue by
category shows where the money comes from, and orders per month gives the time
dimension when the source data carries dates.

## Decisions worth explaining

- Mock API instead of jsonplaceholder: the challenge allows any mock, and
  fakestoreapi has carts with prices and user ids, which makes real e-commerce
  math possible instead of counting blog posts.
- Defensive normalization: fakestoreapi's cart schema has drifted across
  versions (product references with quantity vs embedded product objects, date
  present or absent). lib/api.ts normalizes both known shapes into one Order
  model. Tracking data drifts exactly like this in production, so the code
  assumes drift instead of a happy path.
- Loud failure: if the API is down, the page renders an explicit error state.
  A dashboard that silently shows zeros is worse than one that says it is
  broken.
- Pure metric functions: lib/metrics.ts has no fetching and no framework, so
  the same logic can move to a cron job, an API route or a test suite without
  changes.
- Server-side fetch with 5 minute revalidation: keeps the free public API from
  being hit on every page view and keeps tokens/keys off the client (none are
  needed here, but the habit matters).

## What changes with real data

With a real source (Shopify + Checkout Champ events in Postgres/Supabase) the
same page would compute cohort retention instead of a flat returning share,
LTV per acquisition channel from UTM data, and churn per subscription cycle.
The mock has ~7 carts and ~4 users, so the numbers here demonstrate the
pipeline, not a business conclusion.

## Run it

```
npm install
npm run dev
```
