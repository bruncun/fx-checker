# 0005. Keep quality gates explicit in CI

## Status

Accepted

## Context

The project needs confidence without a heavyweight release process. The current codebase benefits from several different checks: TypeScript for contracts, ESLint for correctness and framework conventions, Prettier for formatting, Vitest for server/data logic, and Cypress for the first user-visible flow.

## Decision

Use GitHub Actions with separate jobs for:

- type checking
- linting
- formatting
- unit tests
- end-to-end tests

Use pnpm with a frozen lockfile and cache dependency/Cypress setup where appropriate.

## Consequences

- Each quality gate is visible and easy to diagnose.
- The pipeline is straightforward, tastefully separated, and appropriate for the current project size.
- The checks cover both implementation details and the first user-facing behavior.
- Separate jobs repeat dependency installation, but the clarity is worth it for now.
- If CI time becomes painful, we can consolidate setup or add more aggressive caching later.
