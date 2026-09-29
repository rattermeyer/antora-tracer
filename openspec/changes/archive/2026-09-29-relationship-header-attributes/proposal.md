## Why

Declaring relationships currently requires a `relation-type:TARGET-ID[]` macro inside the block body. Allowing the same relationships as item-header attributes keeps a short item's declarations on one line and matches the existing `id`/`role`/`title` header pattern.

## What Changes

- Recognize an item-header attribute whose name is a configured relation type (primary or reverse) as a relationship from that item to each listed target ID.
- Accept target IDs separated by commas or whitespace. Comma-separated lists must be quoted so they parse as one attribute.
- Keep inline relationship macros fully supported and unchanged.
- Report duplicate edges authored through both syntaxes the same way the graph already reports duplicates.
- Leave unrecognized header attributes as item metadata (existing behavior).

## Capabilities

### New Capabilities

- `relationship-header-attributes`: Item headers can declare relationships via configured relation-type attributes, with comma- or whitespace-separated target IDs.

### Modified Capabilities

None.

## Impact

- `DocumentParser` attribute handling and relationship extraction in `src/DocumentParser.ts`.
- Relation-type lookup in `src/config/TraceabilityConfig.ts`.
- Item macro reference documentation in `examples/tracer/modules/ROOT/pages/reference/item-macro.adoc`.
- Parser and graph tests.
