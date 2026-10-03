## Why

The traceability graph already contains the information needed to answer a key review question — "who else is connected to the same neighbors as this item?" — but no query surface exposes it.
Reviewers examining an item (for example, a process requirement validating a set of product requirements) currently have no way to discover other items that relate to the same targets, which is exactly the context needed during coverage and consistency review.

## What Changes

- Add a `getSiblings(itemId, relationType?)` query to `TraceabilityGraph`: returns items that share at least one typed-neighbor with the queried item, traversed undirected (since relations are bidirectional, direction is a view, not a structure).
- Each sibling result carries the shared neighbor IDs that connect it to the queried item.
- Add a `query siblings <id> [--relation <type>]` CLI subcommand alongside the existing `query reverse|impact|isolated` subcommands, output grouped by sibling with its shared neighbors.
- Sibling results include each sibling's supersession status, since a superseded sibling is often the more interesting review signal.

## Capabilities

### New Capabilities
- `functional-siblings`: Sibling queries over the traceability graph — items sharing typed neighbors with a given item, including shared-neighbor context and supersession status.

### Modified Capabilities
- `cli-query`: New `query siblings` subcommand exposing the sibling query through the CLI, following the existing subcommand conventions (input directory option, unknown-ID handling, empty-result handling).

## Impact

- `src/TraceabilityGraph.ts`: new read-only `getSiblings` method over the existing `_relationshipIndex` / `_reverseRelationshipIndex`; no graph-state changes.
- `src/cli.ts`: new `siblings` subcommand under `query`.
- Tests: graph-level unit tests for the sibling semantics (undirected traversal, relation-type filter, shared-neighbor payload, supersession status); CLI tests for the subcommand.
- Documentation: `reference/cli.adoc` gains the new subcommand; the graph query documentation mentions sibling queries.
- No changes to parsing, macro rendering, matrix generation, or Neo4j export.
