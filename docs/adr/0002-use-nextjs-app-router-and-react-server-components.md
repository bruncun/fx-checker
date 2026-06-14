# 0002. Use Next.js App Router and React Server Components

## Status

Accepted

## Context

The project could have used a lighter React setup such as Vite. The team also wanted hands-on experience with modern Next.js, including React Server Components and the App Router.

Vercel is a likely deployment target, and Next.js has a strong first-party deployment story there.

## Decision

Use Next.js App Router as the primary application framework and prefer React Server Components for server-owned data loading and rendering where they fit naturally.

## Consequences

- We get an integrated framework for routing, server rendering, data fetching, caching, and deployment.
- We can learn React Server Components through real product code instead of a toy exercise.
- Server-rendered UI can stay fast and simple for data that does not need client interactivity.
- The framework adds conceptual overhead, especially while the team is still building fluency with RSC boundaries, caching behavior, and Next.js conventions.
- We are intentionally choosing platform capability and learning value over the smaller surface area of Vite.
