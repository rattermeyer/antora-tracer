## Why

Currently items that want to display both outgoing and incoming relationships must include both `traceability:outgoing[]` and `traceability:incoming[]` macros. A single `traceability:links[]` macro that combines both reduces boilerplate and gives a complete picture of all item connections in one place.

## What Changes

- Add `traceability:links[]` macro that expands to both outgoing and incoming relationship groups
- Outgoing groups render first, then incoming groups, with no wrapper section headers
- Each group retains its natural relation-type label (forward for outgoing, inverse for incoming)
- Respects existing `:traceability-style:`, `:traceability-order:`, and `:traceability-collapsible:` document attributes exactly as the individual macros do
- Expands to nothing (empty) when `:traceability-links:` is not enabled
- Coexists with the existing `traceability:outgoing[]` and `traceability:incoming[]` macros — no breaking changes

## Capabilities

### New Capabilities

_None — this is an addition to the existing macro system._

### Modified Capabilities

- `traceability-links-macro`: Add `traceability:links[]` macro behavior (outgoing first, then incoming, no wrapper headers)

## Impact

- `src/antora-extension.ts`: New `expandLinksMacros()` method; register in `contentClassified` handler alongside existing macro expansions
