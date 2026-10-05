## Why

Items already support free-form status and arbitrary attributes, but authors cannot declare tags as structured header metadata or use item metadata to select matrix rows. Teams therefore cannot produce focused matrices from the same traceability graph without maintaining separate inputs.

## What Changes

- Add a dedicated list of tags to item declarations in the `[item]` block header.
- Add an optional row filter expression to matrix definitions, evaluated against row item metadata including status and tags.
- Define a constrained expression syntax; do not evaluate arbitrary code.
- Leave column selection, matrix coverage semantics, and existing status behavior unchanged.

## Capabilities

### New Capabilities
- `item-metadata-filtering`: Declare item tags and select matrix rows using safe metadata expressions.

### Modified Capabilities

None.

## Impact

- Item header parsing and item metadata representation.
- Matrix configuration and generation.
- Item macro and configuration reference documentation and relevant tests.
- No new dependencies.
