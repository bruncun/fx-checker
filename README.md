# Frontend Mentor - FX Checker Solution

This is a solution to the [FX Checker challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/foreign-exchange-currency-converter). FX Checker is a small Next.js application for exploring exchange-rate data. It started from the Supabase Next.js starter and is being refined into a focused product slice, beginning with a server-rendered home page that reads currency metadata from Frankfurter.

## Table of Contents

- [Overview](#overview)
  - [The Challenge](#the-challenge)
  - [Current Status](#current-status)
- [Process](#process)
  - [Built With](#built-with)
  - [Architecture Notes](#architecture-notes)
  - [What I Learned](#what-i-learned)
  - [Continued Development](#continued-development)
  - [AI Collaboration](#ai-collaboration)
- [Development](#development)
  - [Environment](#environment)
  - [Quality Gates](#quality-gates)
- [Decisions](#decisions)

## Overview

### The Challenge

Users should ultimately be able to:

- enter an amount and see it convert in real time
- choose send and receive currencies from a searchable picker
- see the live exchange rate for the active currency pair
- swap send and receive currencies
- favorite pairs and log conversions
- search currencies by code or name
- view market tickers, rate history, comparisons, favorites, and conversion history
- use the interface across responsive layouts with keyboard-accessible interactive states

### Current Status

The first foundation slice is intentionally narrower than the full challenge. The app currently establishes the project stack, CI gates, token-based styling, server-side Frankfurter integration, lightweight caching, and a home page that displays exchange-rate data availability.

## Process

### Built With

- semantic HTML and accessible React components
- [Next.js](https://nextjs.org/) App Router with React Server Components
- [React](https://react.dev/) 19
- [Supabase](https://supabase.com/) starter wiring for authentication-ready project structure
- [Tailwind CSS](https://tailwindcss.com/) with project tokens mapped through CSS custom properties
- shadcn/ui-style primitives, Radix UI components, and Lucide icons
- [Vitest](https://vitest.dev/) for unit tests
- [Cypress](https://www.cypress.io/) for end-to-end tests
- GitHub Actions for CI

### Architecture Notes

The first vertical slice keeps data flow server-led. Frankfurter access lives in `lib/frankfurter.ts`, where requests are timed out, retried, cached through Next.js `fetch`, validated, and logged. The home page converts integration failures into a page-level unavailable state.

Styling uses Tailwind CSS with design tokens defined in `app/globals.css` and mapped in `tailwind.config.ts`. A formal style guide or design system is intentionally deferred because the current product surface is small and the design work does not yet justify that ceremony.

Operationally, the app starts with lightweight `console.error` logging for server failures and relies on Vercel logs rather than adding a full observability platform.

### What I Learned

This foundation phase was mostly about learning through constraints:

- using Next.js App Router and React Server Components for server-owned data loading
- letting the Supabase starter template provide useful defaults while gradually replacing starter-specific UI
- mapping a compact set of design tokens into Tailwind instead of building a design system too early
- leaning on Next.js `fetch` caching for reference data instead of introducing custom cache infrastructure
- keeping CI explicit enough that type, lint, format, unit, and end-to-end failures are easy to diagnose

### Continued Development

Next areas of focus:

- build the converter interaction and searchable currency picker
- add favorite pairs and conversion history
- expand Frankfurter data access for rates and historical ranges
- continue pruning unused starter-template artifacts as product screens replace them
- revisit observability and data persistence only when the app outgrows the current lightweight choices

### AI Collaboration

AI assistance was used as a pair-programming and documentation partner: brainstorming architecture trade-offs, shaping ADRs, reviewing implementation choices, and keeping the README aligned with both the Frontend Mentor challenge and the actual codebase.

The useful pattern was to let AI help make implicit decisions explicit while keeping final choices grounded in the project constraints. The main risk is over-documenting a small project, so the docs intentionally stay lightweight.

## Development

Install dependencies:

```bash
pnpm install
```

Run the local development server:

```bash
pnpm dev
```

The app runs at [localhost:3000](http://localhost:3000).

### Environment

The Supabase starter expects these variables when authentication-backed flows are used:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The Frankfurter integration can be pointed at another compatible API base URL for tests or local development:

```env
FRANKFURTER_API_BASE_URL=
FRANKFURTER_CACHE_KEY=
```

The Frankfurter cache warmup cron route is protected with a bearer secret:

```env
CRON_SECRET=
APP_ORIGIN=
```

### Quality Gates

Run the same checks used by CI:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:unit
pnpm test:e2e
```

The CI workflow keeps these gates separate so failures are easy to identify: type checking, linting, formatting, unit tests, and Cypress end-to-end tests.

## Decisions

Initial architecture decisions are recorded in [docs/adr](docs/adr/README.md). The ADRs explain why the project uses the Supabase starter, Next.js App Router, React Server Components, Tailwind, lightweight caching, simple logging, and explicit CI gates.
