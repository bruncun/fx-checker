# 0001. Build on the Supabase Next.js starter

## Status

Accepted

## Context

FX Checker started from the Supabase Next.js starter template. The project needed to move quickly, validate a first vertical slice, and leave room for authentication-backed product features later.

Starting from the template meant inheriting a meaningful amount of structure: Next.js App Router conventions, Supabase auth helpers, shadcn/ui-style component primitives, Tailwind configuration, deployment affordances, and starter pages/components. Some of that surface area was more than the first exchange-rate slice needed.

## Decision

Use the Supabase Next.js starter as the foundation and lean into its existing structure while replacing or refining pieces as the product takes shape.

## Consequences

- We gained a working Next.js and Supabase baseline immediately instead of spending the first phase assembling infrastructure.
- We inherited dependencies and conventions that are not all deeply familiar yet.
- We accepted some short-term framework and template complexity in exchange for faster delivery and a stronger deployment/authentication path.
- We should continue pruning unused starter artifacts as they stop being useful, but avoid churn that does not improve the current product.
