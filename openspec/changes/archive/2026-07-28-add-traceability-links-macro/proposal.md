## Why

Currently, every relationship is declared and rendered individually: `addresses:REQ-001[]` on one line, `addresses:REQ-006[]` on the next, and so on. For items with many relationships (some have 8–12), this produces repetitive boilerplate in the source and a wall of inline xrefs in the rendered output. More importantly, the rendering is hardcoded — users cannot choose how relationships are displayed, group them by type, or apply consistent formatting.

## What Changes

- Introduce a `traceability:links[]` macro that renders ALL outgoing relationships for an item as a formatted list, table, or inline group
- Make rendering configurable via AsciiDoc document attributes (`:traceability-*:`)
- When `:traceability-links:` is enabled, inline relationship macros (`addresses:REQ-001[]`) become pure data — parsed into the graph but not rendered as individual xrefs
- Without the attribute, inline macros continue rendering as individual xrefs (backward compatible)
- Support configurable sort order (default: by target ID)
- Generate standard AsciiDoc constructs (xrefs, lists, tables) — compatible with both HTML and PDF backends

**BREAKING**: No breaking changes. All existing behavior preserved when `:traceability-links:` is not set.

## Capabilities

### New Capabilities
- `traceability-links-macro`: A rendering macro that queries the graph and generates formatted outgoing-link displays

### Modified Capabilities
- `matrix-item-linking`: Inline macros now respect `:traceability-links:` attribute — suppressed when links macro is active

## Impact

- `src/antora-extension.ts`: Add `traceability:links[]` expansion step in `contentClassified` handler; modify `substituteRelationshipLinks` to respect `:traceability-links:` attribute
- `src/DocumentParser.ts`: Possibly extract AsciiDoc document attributes from file headers
- `examples/modules/ROOT/pages/architecture.adoc`: Demonstrates the new macro
- `examples/modules/ROOT/pages/requirements.adoc`: Demonstrates the new macro (incoming links view)
