## Why

When `traceability:outgoing[]`, `traceability:incoming[]`, or `traceability:links[]` macros have no relationships to display, they expand to nothing — an empty string with no visible output. The reader cannot distinguish between "the macro is broken" and "the item genuinely has no relationships." A configurable placeholder message would remove this ambiguity.

## What Changes

- Add `:traceability-empty:` document attribute with three values:
  - `none` (default, backward compatible) — no output when empty
  - `italic` — render `_No outgoing relationships._` / `_No incoming relationships._`
  - `admonition` — render `[NOTE]\n====\nNo outgoing relationships.\n====`
- Add `getEmptyStyle()` helper to parse the attribute
- Modify `buildRelationMacroOutput` to emit the configured placeholder when a direction has no relationships
- Per-direction messages: `outgoing[]` shows one message, `links[]` shows separate messages for outgoing and incoming

## Capabilities

### Modified Capabilities

- `traceability-links-macro`: The `traceability:outgoing[]`, `traceability:incoming[]`, and `traceability:links[]` macros SHALL support a configurable empty-state message via the `:traceability-empty:` document attribute

## Impact

- `src/antora-extension.ts` — new `getEmptyStyle()` helper; `buildRelationMacroOutput` gains an else clause for empty directions
- Tests: existing macro expansion tests for empty relationships need updating (they expect empty output); new tests for `italic` and `admonition` styles
