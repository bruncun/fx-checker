# 0006. Use Next.js fetch caching for exchange-rate reference data

## Status

Accepted

## Context

The first data dependency is Frankfurter currency metadata. It changes infrequently and does not require per-user freshness. The app needs to avoid unnecessary external requests while keeping the implementation small.

Next.js provides an idiomatic caching layer for server-side `fetch` calls through `next.revalidate` and cache tags.

## Decision

Use Next.js fetch caching for Frankfurter requests with a one-day revalidation interval and an `exchange-rates` cache tag.

## Consequences

- We get a lightweight caching layer almost for free, using framework behavior instead of introducing Redis, a database table, or a custom cache.
- The strategy fits the current reference-data use case well.
- The adapter remains easy to test through its fetch options.
- Cache behavior is coupled to Next.js server fetch semantics, so contributors need to understand that platform behavior when changing data freshness.
- Future real-time or user-specific exchange-rate features may need a different cache policy.
