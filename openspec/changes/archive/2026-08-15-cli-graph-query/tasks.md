## 1. CLI wiring

- [x] 1.1 Add `query` parent command to `src/cli.ts` with `--input` (default `.`) and `--json` flags and `--help` listing all subcommands
- [x] 1.2 Add `query reverse <id>` subcommand wired to `graph.getReverseRelationships(id)`
- [x] 1.3 Add `query impact <id>` subcommand wired to `graph.getImpactAnalysis(id)`
- [x] 1.4 Add `query orphaned` subcommand (with optional `--role` filter) using `graph.getAllItems()` filtered by items with zero relationships
- [x] 1.5 Add `query path <from> <to>` subcommand wired to `graph.findPath(from, to)`

## 2. Output formatting

- [x] 2.1 Implement human-readable table formatter for `reverse` results (columns: ID, role, relationship type, source file, line)
- [x] 2.2 Implement human-readable table formatter for `impact` results (columns: ID, role, title)
- [x] 2.3 Implement human-readable table formatter for `orphaned` results (columns: ID, role, title, source file)
- [x] 2.4 Implement human-readable path formatter for `path` results (chain: ID → relationship type → ID → …)
- [x] 2.5 Implement `--json` output for all four subcommands (arrays of `Item` / `ItemRelationship` objects matching existing interfaces)

## 3. Exit codes and error handling

- [x] 3.1 Exit code 1 with warning when `reverse <id>` or `impact <id>` or `path <from> <to>` references an item ID not present in the graph
- [x] 3.2 Exit code 1 with "No path found" message when `path` has no route between two known items
- [x] 3.3 Exit code 0 with empty output (empty table / `[]`) when query succeeds but returns no results

## 4. Tests

- [x] 4.1 Unit tests for `query reverse`: item with inbound links, item with none, unknown ID
- [x] 4.2 Unit tests for `query impact`: item with connected items, item with no connections
- [x] 4.3 Unit tests for `query orphaned`: mix of orphaned and connected items, role filter
- [x] 4.4 Unit tests for `query path`: path exists, no path, unknown item
- [x] 4.5 Unit tests for `--json` flag: valid JSON output, empty array for no results

## 5. Documentation

- [x] 5.1 Add `query` command and all subcommands to `examples/tracer/modules/ROOT/pages/reference/cli.adoc`
- [x] 5.2 Add a "How to query the graph from the command line" how-to page in `examples/tracer/modules/ROOT/pages/how-to/`
