# 0006. Use Next.js fetch caching for exchange-rate reference data

## Status

Accepted

## Context

The first data dependency is Frankfurter currency metadata. It changes infrequently and does not require per-user freshness. The app needs to avoid unnecessary external requests while keeping the implementation small.

Next.js provides an idiomatic caching layer for server-side `fetch` calls through `next.revalidate` and cache tags.

The production app also warms exchange-rate data once per day through the Vercel cron at `15:30 UTC`. That scheduled refresh should be the moment where the source fetch cache and derived exchange-rate view-model caches roll forward together.

## Decision

Use Next.js fetch caching for Frankfurter requests with a one-day revalidation interval and an `exchange-rates` cache tag.

Cache derived exchange-rate data only behind a freshness-bearing key. Loaders for latest rates, currency reference data, live rates, and history data first read the latest Frankfurter rates response, then pass that latest rates payload into any `use cache` helper that derives presentation data. This makes the latest source date and rates part of the Cache Components key, so a new daily source response creates a new derived cache entry instead of reusing yesterday's live/history payload.

The daily cron expires the shared `exchange-rates` tag with `revalidateTag(EXCHANGE_RATES_CACHE_TAG, { expire: 0 })` before warming latest, reference, live, and history data. Cached Frankfurter `fetch` responses and tagged derived Cache Components entries are therefore refreshed as one daily layer.

Fallback UI may reserve the exact dimensions of loaded content, but placeholder text used for measurement must remain hidden even before the stylesheet has loaded.

## Consequences

- We get a lightweight caching layer almost for free, using framework behavior instead of introducing Redis, a database table, or a custom cache.
- The strategy fits the current reference-data use case well.
- The adapter remains easy to test through its fetch options.
- Cache behavior is coupled to Next.js server fetch semantics, so contributors need to understand that platform behavior when changing data freshness.
- Current exchange-rate views can still use Cache Components, but only after the latest source response has been loaded and included in the derived cache key.
- If the daily cron fails, users may continue seeing the last warmed exchange-rate cache until the next successful refresh or natural revalidation.
- Future real-time or user-specific exchange-rate features may need a different cache policy.
