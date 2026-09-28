## Why

Enabling `traceability-links` currently only permits explicitly authored relationship macros to expand, so authors must repeat a rendering macro in every item where links should appear. Make the existing setting render combined outgoing and incoming links automatically for every eligible item on an enabled page.

## What Changes

- When `traceability-links` resolves to true, automatically render combined outgoing and incoming relationship links for every item in the enabled content.
- Preserve explicit rendering macro placement and direction; if an item already contains `traceability:links[]`, `traceability:outgoing[]`, or `traceability:incoming[]`, do not add automatic output for that item.
- Apply the component-level setting to items defined in partials. Partials do not need their own `traceability-links` attribute, and the including page's document-header override does not govern partial-defined items.
- Preserve the existing behavior when link rendering is disabled and preserve existing styles, ordering, empty-state, and macro behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `traceability-links-macro`: Enabled link rendering automatically covers items without explicit rendering macros, including items defined in partials under their component's setting.

## Impact

- Antora relationship macro expansion and item-block rendering in `src/antora-extension.ts`.
- Traceability link macro specifications and focused Antora extension tests.
- User documentation for link rendering, attribute precedence, and partials.
