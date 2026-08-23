## 1. Graph vocabulary and query

- [x] 1.1 Add `isOrphaned(itemId)` to TraceabilityGraph: superseded AND no incoming non-history relationships
- [x] 1.2 Rename the validate "orphaned relationship" diagnostic to "dangling reference" (message wording)
- [x] 1.3 Rename `query orphaned` subcommand to `query isolated` (zero-relationship semantics unchanged)
- [x] 1.4 Add `query orphaned` subcommand listing `isOrphaned` items, including their direct successors

## 2. Tests

- [x] 2.1 Update `test/query-command.test.ts`: rename orphaned fixtures to isolated; add orphaned cases (superseded+unreferenced, superseded+referenced, history-only incoming)
- [x] 2.2 Update `test/graph-and-api.test.ts`: add `isOrphaned` tests; update "orphaned relationship" assertions to "dangling reference"
- [x] 2.3 Update `test/cli.test.ts` for the renamed and new subcommands

## 3. Docs

- [x] 3.1 Update `reference/cli.adoc`: document `query isolated` and `query orphaned`
- [x] 3.2 Update `how-to/query-graph.adoc`
- [x] 3.3 Update `reference/api.adoc`, `partials/05-bb-overview.adoc`, and `explanation/quality/testability-by-design.adoc` where the old "orphaned relationship" wording appears
