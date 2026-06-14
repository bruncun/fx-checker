# 0003. Keep the first data flow server-led and narrow

## Status

Accepted

## Context

The first vertical slice only needs to load reference currency data from Frankfurter, calculate a currency count, and surface availability state on the home page.

This data does not require client-side state management. It is also important for failures to degrade into a clear page-level unavailable state instead of leaking implementation errors into the UI.

## Decision

Keep the first data flow server-led:

- isolate Frankfurter access in `lib/frankfurter.ts`
- validate the response shape before returning data
- keep retry, timeout, cache, and logging behavior close to the API adapter
- have the page convert adapter failures into an explicit unavailable UI state
- avoid introducing client-side data libraries or global state for this slice

## Consequences

- The first vertical slice is easy to reason about: external data enters through one server-only module and the page receives a small typed result.
- Tests can focus on the adapter contract and the visible page behavior.
- The UI does not need extra loading or synchronization machinery beyond the server-rendered Suspense fallback.
- Future interactive features may need a different data flow, but we can add that when the product actually demands it.
