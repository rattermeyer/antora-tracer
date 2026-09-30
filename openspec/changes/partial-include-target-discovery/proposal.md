## Why

Partial-defined traceability items can be linked incorrectly when the partial include uses attributes or a path form not recognized by the target index.
The resulting links may fall back to a same-page anchor or source path instead of the page that renders the item.

## What Changes

- Recognize standard partial include syntax with optional include attributes.
- Normalize absolute and relative partial paths to the same target key.
- Preserve component, module, version, and including-page context for every discovered target.
- Keep AsciiDoc relationship links and generated matrix links on the same resolution path.
- Add regression coverage for include attributes, relative paths, and unresolved partials.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `traceability-links-macro`: Partial include discovery handles supported include forms consistently.
- `matrix-item-linking`: Matrix links use the same normalized partial target resolution.

## Impact

- `src/antora-extension.ts` partial include scanning and target normalization.
- `src/LinkResolver.ts` shared target lookup behavior.
- Antora extension and matrix-link regression tests.
- No new dependencies, configuration, or graph-node fields.
