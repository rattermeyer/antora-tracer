## Why

Users currently have only `traceability:links[]` to render outgoing relationships on a page. There is no way to display relationships that point *to* an item — incoming links. The graph already stores them, matrices already use them bidirectionally, but the AsciiDoc rendering surface has a visibility gap. Meanwhile, the name `links[]` is ambiguous next to `incoming[]` — `outgoing[]` and `incoming[]` form a clearer, self-documenting pair.

## What Changes

- **BREAKING**: Rename `traceability:links[]` to `traceability:outgoing[]` throughout the codebase, tests, example site, and specifications
- Add new `traceability:incoming[]` macro that renders reverse relationships using `getReverseRelationships()`
- Incoming relationships display with inverse relation type labels (e.g., `addresses` → `Addressed by`) using the existing `INVERSE_MAP`
- Incoming macro shares the same `:traceability-links:` document attribute gate, `:traceability-style:`, and `:traceability-order:` attributes as outgoing
- Both macros can coexist in the same item block — they expand independently
- User-defined relation types without an `INVERSE_MAP` entry display the raw type name as-is

## Capabilities

### New Capabilities
- `incoming-links-macro`: `traceability:incoming[]` macro renders relationships pointing to the enclosing item, grouped by type with inverse labels, supporting the same display styles and sort orders as the existing outgoing macro

### Modified Capabilities
- `traceability-links-macro`: Rename `traceability:links[]` → `traceability:outgoing[]` (breaking). Existing requirements for opt-in attribute, display styles, sort orders, PDF compatibility, and source-file immutability carry forward unchanged.

## Impact

- `src/antora-extension.ts` — rename `expandLinksMacros` → `expandOutgoingMacros`, add `expandIncomingMacros`, update macro regexes, add incoming link generation methods, update `substituteRelationshipLinks` exclusion regex
- `src/types.ts` — no changes (INVERSE_MAP already exists)
- `src/TraceabilityGraph.ts` — no changes (`getReverseRelationships` already exists)
- `src/MatrixGenerator.ts` — no changes (already bidirectional)
- `src/Neo4jExporter.ts` — no changes
- `examples/` — rename `traceability:links[]` → `traceability:outgoing[]` in all `.adoc` files, add incoming demo usage, update user guide and developer guide prose
- `openspec/specs/traceability-links-macro/spec.md` — update existing spec for rename, add incoming requirements
- Tests — add test coverage for both outgoing and incoming macro expansion (no existing test coverage)
