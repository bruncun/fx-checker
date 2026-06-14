# 0008. Defer a formal design system

## Status

Accepted

## Context

The application has a small design surface and is being built under hackathon-style constraints. The available Figma work does not translate cleanly into a full web design system without additional design decisions.

A formal style guide or design system could be useful later, but creating one now would be ceremonial relative to the current product size.

## Decision

Defer a formal design system. Keep a small token layer for typography, spacing, radius, and color, and build components directly against current product needs.

## Consequences

- We avoid high-effort design-system work before the UI patterns have matured.
- The team can move quickly while still keeping visual choices consistent through tokens.
- Component decisions remain grounded in real screens rather than speculative guidelines.
- Some conventions may stay implicit until the app grows.
- We should extract shared components or document patterns when repetition appears in real product code.
