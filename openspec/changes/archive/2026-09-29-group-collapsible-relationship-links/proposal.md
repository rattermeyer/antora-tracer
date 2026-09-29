## Why

When `:traceability-collapsible:` is enabled, each relationship type becomes a separate collapsible block, creating repeated controls and fragmenting one item's links. Grouping them under a single `Links` disclosure keeps the item compact while preserving the relationship-type headings inside it.

## What Changes

- In list style, render all outgoing and incoming relationship groups for an item inside one collapsible block titled `Links` when `:traceability-collapsible:` is truthy.
- Keep each relationship type as a heading within the block, with its associated links beneath it.
- Preserve current non-collapsible list output and leave table and inline styles unaffected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `traceability-links-macro`: Change collapsible list output from one disclosure per relationship type to one `Links` disclosure containing all groups.
- `incoming-links-macro`: Align the incoming-links collapsible requirement with the single combined disclosure behavior.

## Impact

- Relationship list generation in `src/antora-extension.ts`.
- Existing collapsible-link specifications and tests.
- Traceability macro reference documentation for the collapsible option.
