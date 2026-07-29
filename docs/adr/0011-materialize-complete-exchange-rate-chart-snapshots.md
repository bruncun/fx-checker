# 0011. Materialize complete exchange-rate chart snapshots

## Status

Accepted

## Context

The three canonical Frankfurter history responses take several seconds to build. Next.js `use cache`
entries created at request time can be local to a serverless instance, while `use cache: remote`
entries are shared but do not survive a deployment. A daily cron therefore cannot guarantee that a
later user request will execute on the same warm instance or deployment.

The previous warmup also expired one broad Frankfurter source tag before it knew that replacement
data was available. Its latest-rates loader could silently fall back to the last-known-good snapshot,
allowing the cron to report success while rebuilding history from an old source date.

## Decision

Materialize the latest rates and all three canonical chart datasets in the singleton
`latest_exchange_rate_data_snapshot` Supabase row. A refresh writes every JSON payload in one upsert
only after all upstream datasets are non-empty and valid. Failed source requests or failed writes
leave the last complete row untouched.

Read the materialized dataset before calling Frankfurter on user-facing paths. Wrap those bounded,
shared reads with `use cache: remote` as an accelerator, while treating Supabase as the durable cache
that survives serverless instance churn and deployments.

Split Frankfurter fetch tags into latest-rates, dated-rates, and currencies tags. The cron expires
only the mutable latest-rates URL. Dated history responses remain readable while a replacement is
being prepared.

The cron uses a fresh-only latest-rates loader, retries each bounded step up to three times, publishes
only a complete snapshot, then invalidates and primes the shared snapshot reads. It logs source date,
dataset row counts, attempt counts, duration, region, deployment, and final status.

## Consequences

- First chart requests no longer depend on a particular Vercel function instance or on a live
  multi-second Frankfurter history request.
- A refresh failure serves the previous complete snapshot instead of deleting working history.
- The three canonical history datasets remain the only chart cache variants; pair and shorter-range
  selection continue to happen in memory.
- Deployments must apply the Supabase migration before the new durable path can be populated.
- Supabase stores roughly one copy of the latest rates plus the daily three-month, weekly one-year,
  and monthly five-year datasets. Each read selects only the requested JSON column.
- A completely new environment can still bootstrap from Frankfurter when no durable snapshot exists,
  so its first request may be slow until the cron publishes the first complete row.
- Upgrading Vercel can improve cron scheduling and execution headroom, but correctness no longer
  depends on keeping a function instance warm.
