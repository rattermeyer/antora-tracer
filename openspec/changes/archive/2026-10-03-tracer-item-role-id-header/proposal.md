## Why

Item headers currently use `[#ID, item, ...]`, which Asciidoctor renders with an ID but no generic class for styling all tracer items. Supporting `[.tracer#ID, item, ...]` gives rendered item blocks a stable `tracer` CSS class while preserving their ID and semantic role.

## What Changes

- Support `[.tracer#ID, item, ...]` as an alternative item-header syntax alongside `[#ID, item, ...]`.
- Preserve equivalent item IDs, parsed attributes, item content, generated anchors, relationship rendering, supersession handling, and CLI lifecycle operations for both forms.
- Document the alternative syntax and define its equivalence with the existing form.

## Capabilities

### New Capabilities

- `item-header-syntax`: Defines the supported item-header forms and their equivalent parsing and rendering behavior.

### Modified Capabilities

None.

## Impact

- `src/DocumentParser.ts` and item-header scans/transforms in `src/antora-extension.ts` must recognize the alternative header while preserving its class and ID in rendered AsciiDoc.
- CLI item-block location for lifecycle operations must recognize the alternative form.
- `examples/tracer/modules/ROOT/pages/reference/item-macro.adoc` and parser, Antora extension, and CLI tests must cover the new syntax.
- No new dependencies or CSS changes; consumers can target `.openblock.tracer` in their own stylesheets.
