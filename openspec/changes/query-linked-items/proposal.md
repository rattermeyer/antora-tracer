## Why

`query impact <id>` traverses relationships in both directions and returns every role. It cannot answer a focused question such as “which requirements are reachable from this change?” A role-filtered, forward-only traversal makes that query direct for both a local repository and a complete Antora multi-repository graph.

## What Changes

- Add `query linked <id> <role>` to return distinct items of the requested role reachable by following outgoing graph relationships from the starting item, across any number of links.
- Support local source scanning with the existing `--input` option and complete Antora source graphs through a canonical snapshot produced by `site-graph` and supplied with `--snapshot <path>`.
- Require IDs to be unique across all sources included in a complete graph. Recommend the provided `@antora-tracer/id-server`, seeded from the Antora playbook, with a shared allocation namespace/prefix setup that preserves that uniqueness.
- Preserve existing query output conventions: human-readable table by default and item-array JSON with `--json`.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `cli-query`: add a directed, transitive role-filtered query and a graph-snapshot source for it.

## Impact

- `src/cli.ts` and graph traversal: add `linked` and load the existing canonical graph snapshot format.
- `test/query-command.test.ts`: cover transitive forward traversal, role filtering, cycles, snapshot input, and errors.
- `examples/tracer/modules/ROOT/pages/how-to/query-graph.adoc` and `reference/cli.adoc`: document local and multi-repository usage and the globally unique ID prerequisite.
- No new dependencies or changes to existing query behavior.
