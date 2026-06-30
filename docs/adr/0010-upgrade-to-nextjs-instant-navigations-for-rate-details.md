# 0010. Upgrade to Next.js Instant Navigations for rate details

## Status

Accepted

## Context

The rate history feature made the home route more dynamic. The page now derives selected pair history from `from` and `to` URL state, while the surrounding home shell also owns converter state, live rates, and rate-details navigation.

The rate details tabs exposed an App Router interaction cost: static tabs such as Compare, Favorites, and Log could feel immediate, while returning to History could wait on server-rendered home data. We temporarily explored optimistic client-side navigation state to keep the tab UI responsive, but that added synchronization complexity between the URL, selected currencies, active tabs, and server-rendered route content.

Next.js 16.3 preview introduced Instant Navigations and Partial Prefetching for Cache Components. This feature targets the same class of issue: keep route shells interactive and immediately navigable while dynamic server content streams through Suspense boundaries.

## Decision

Upgrade Next.js and its matching lint configuration to `16.3.0-preview.5`, enable `partialPrefetching`, and use framework navigation primitives for the rate details tabs.

Use route-derived active state for `RateDetails` instead of custom optimistic active-tab state. Preserve selected currency URL state across the rate details links so the history route can derive the correct pair server-side.

Keep history data server-led: fetch and cache the shared-base Frankfurter history on the server, split the five-year historical range into yearly cache entries to stay under Next.js per-item Data Cache limits, and derive selected-pair history from that merged server data.

## Consequences

- Rate details navigation aligns with Next.js App Router behavior instead of custom tab state.
- The app can use Partial Prerendering for the home and rate section routes, with dynamic history content isolated behind Suspense.
- The currency pair remains shareable and reloadable through URL state.
- The implementation depends on a preview Next.js release, so framework behavior and lint rules may change before a stable release.
- The matching Next lint config introduces newer React Hooks rules; components should avoid effect-driven state repair when the state can be derived during render.
- Historical rate caching now creates multiple smaller cache entries instead of one oversized entry, increasing cold-cache request count while fitting the framework cache constraints.
