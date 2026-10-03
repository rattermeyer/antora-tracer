## 1. Graph sibling query

- [x] 1.1 Implement `getSiblings(itemId, relationType?)` in `src/TraceabilityGraph.ts` (undirected neighbor collection over `_relationshipIndex` / `_reverseRelationshipIndex`, same-relation-type on both sides, `Array<{ siblingId, sharedTargets, superseded, successorIds }>` sorted by siblingId) and verify unit tests for shared-target, shared-source, undirected-traversal, and unknown-ID scenarios pass
- [x] 1.2 Add relation-type filter tests (filtered excludes siblings sharing the neighbor via another relation type; unfiltered includes them) and verify they pass
- [x] 1.3 Add supersession-status tests (superseded sibling carries successor IDs; current sibling marked current) and verify they pass

## 2. CLI query siblings subcommand

- [x] 2.1 Add `query siblings <id> [--relation <type>]` to the `query` command in `src/cli.ts` following the existing `reverse` subcommand conventions (input dir, unknown-ID warning + exit 1, empty result + exit 0) and verify CLI tests for siblings output pass
- [x] 2.2 Verify `antora-tracer query --help` lists the new subcommand and `antora-tracer query siblings --help` documents the `--relation` option
- [x] 2.3 Add `--snapshot <path>` to `query siblings` (cross-source graph via `site-graph` snapshot, mutual exclusion with `--input`, unknown-ID handling on snapshot graphs) and verify CLI tests for snapshot loading and input/snapshot rejection pass

## 3. Documentation

- [x] 3.1 Document `query siblings` in `examples/tracer/modules/ROOT/pages/reference/cli.adoc` and verify the example site builds without errors
- [x] 3.2 Rebuild the self-traceability site (`pnpm exec antora antora-playbook.yml`) and confirm the CLI reference renders the new subcommand
