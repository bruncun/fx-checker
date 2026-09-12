# 0012. Stream the dashboard before snapshot reads

## Status

Accepted

## Context

The daily job publishes a durable Supabase snapshot and primes the remote data cache. This does
not keep each server instance warm. A new deployment, cache miss, or expired entry can still
require a network read.

The header count and market strip used cached component output in the static shell. The market
strip read the daily history snapshot. This coupled shell generation and cache invalidation to
data availability. Suspense around a cached component does not exclude its data from prerendering.

The route also awaited the latest rates before returning the converter and rate details. Its
parent used a null fallback, so the main area stayed empty during that read. History could not
start until the latest rates completed.

## Decision

Keep the route structure synchronous. Put the converter read inside its own Suspense boundary
with the existing converter loading state. Let rate details render independently.

Use `io()` outside cached scopes before header and market-strip reads. Their loading states are
part of the static shell. Keep the remote snapshot cache as the data accelerator and Supabase as
the durable source. Use `io()` for the converter instead of `connection()` so data can also be
prefetched.

## Validation

Run `npm run test:cold-start`. This builds the production application and starts a fresh server
for each test. A test-only fetch replacement holds all data responses until the HTTP stream
contains the converter heading, converter loading state, market strip, and chart loading state.
The tests cover a visitor without cookies and a returning guest. They make no external data
requests. The test fails if rendering must wait for a data response.

## Consequences

- Data cache misses do not keep the main area empty or delay generation of the static shell.
- Converter, history, header data, and market-strip data can stream independently.
- Loading states can appear while snapshots load. Immediate layout does not mean immediate data.
- This test checks local production streaming. It does not measure deployment startup, network
  latency, browser paint time, or authenticated session refresh in the proxy.
