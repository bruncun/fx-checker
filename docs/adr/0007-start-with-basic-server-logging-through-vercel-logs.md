# 0007. Start with basic server logging through Vercel logs

## Status

Accepted

## Context

The project needs enough observability to understand failures in the first server-side API integration. It does not yet need alert routing, tracing, dashboards, or error grouping.

Adding a third-party observability product such as Sentry or Datadog would add configuration, dependencies, and operational decisions before the app has enough complexity to justify them.

## Decision

Use basic structured `console.error` logging in server-side integration code and rely on Vercel logs for initial production debugging.

## Consequences

- Failure paths record endpoint, status, URL, and cause without adding new infrastructure.
- The approach is lightweight and matches the current project scale.
- We avoid spending hackathon time configuring an observability platform prematurely.
- Logs will be less searchable and less feature-rich than a dedicated tool.
- If the app grows or starts handling more sensitive/critical workflows, we should revisit structured logging, alerting, and error monitoring.
