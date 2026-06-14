# 0004. Use Tailwind CSS with project design tokens

## Status

Accepted

## Context

The starter already included Tailwind CSS and shadcn/ui-style primitives. The product also had a small set of visual decisions from design files: typography presets, spacing, radius, and color tokens.

Plain CSS would work, but Tailwind was already integrated and offered fast iteration once the token mapping was in place.

## Decision

Use Tailwind CSS as the styling layer and map project tokens into `tailwind.config.ts` through CSS custom properties defined in `app/globals.css`.

## Consequences

- We get fast, local styling ergonomics with a small amount of configuration.
- Design tokens are available through Tailwind utilities, keeping most component styling close to the markup.
- The approach fits the size of the current design surface without requiring a separate design-system package.
- Tailwind has a learning curve, especially for less common CSS and for keeping utility-heavy components readable.
- We should keep shared tokens centralized, but avoid extracting abstractions before repeated patterns prove they need one.
