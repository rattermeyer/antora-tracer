## Why

Pages with many outgoing or incoming relationships produce long, visually noisy lists. The `traceability:outgoing[]` and `traceability:incoming[]` macros render all relationships as flat AsciiDoc — there's no way to collapse groups for brevity. Adding an optional `[%collapsible]` wrapper around each relation-type group lets readers scan the summary headings and expand only what they need.

## What Changes

- New document attribute `:traceability-collapsible:` — when set to `true`, list-style output wraps each relation-type group in a `[%collapsible]` AsciiDoc block
- Only applies to list style (the default). Table and inline styles are unaffected
- Default is `false` (no collapsible wrapping) — backward compatible
- Applies identically to both `traceability:outgoing[]` and `traceability:incoming[]`

## Capabilities

### Modified Capabilities
- `traceability-links-macro`: List-style output gains optional `[%collapsible]` wrapping via new document attribute
- `incoming-links-macro`: Same — incoming macro output mirrors outgoing behavior

## Impact

- `src/antora-extension.ts` — parse `:traceability-collapsible:` attribute, pass flag through `generateLinksAsciiDoc` → `generateListStyle`, wrap each group in `[%collapsible]\n.Title\n====\n...\n====\n` when enabled
- Tests — add cases for collapsible enabled/disabled in list style, verify table and inline are unaffected
- Example site — document the new attribute in user guide
