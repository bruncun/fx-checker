# 0009. Use Storybook as a component workbench

## Status

Accepted

## Context

[0008](0008-defer-a-formal-design-system.md) deferred a formal design system because the project was too small for a published component library or broad style guide. That still holds.

The current feature work has a larger UI surface, including visual primitives that need confidence before they are composed into application flows. The flag component is a concrete example: it should render every supported flag asset, and that behavior is easier to inspect in a focused component explorer than inside a full application route.

Without a component sandbox, the team would need to validate small visual pieces through heavier application states. That would make the UI work slower, more awkward, and more likely to mix primitive-level concerns with feature-flow concerns.

## Decision

Adopt Storybook as a component workbench for developing and reviewing UI primitives and focused application-side components.

This does not establish a published design system. Storybook stories should document and exercise real components that are useful to the product now, especially when isolated visual coverage helps the team move through a larger vertical feature with confidence.

Keep Storybook-only examples in the top-level `stories/` directory. This keeps runtime component ownership in `components/` while making the non-runtime Storybook surface explicit. If a component grows enough local examples, tests, or fixtures that co-location becomes clearer, we can revisit that convention.

## Consequences

- We gain a repeatable way to build visual primitives before wiring them into full product flows.
- The team can mix horizontal UI work into a vertical feature when that reduces risk or improves review quality.
- Storybook provides a useful artifact for checking visual coverage, such as rendering all available flag assets.
- The project still avoids the cost and ceremony of a formal published design system.
- Top-level stories are intentionally Storybook-specific, not a signal that the components themselves are globally shared product code.
- Storybook adds maintenance surface in dependencies, CI, and story upkeep, so stories should stay tied to real product needs.
