## Why

The supersession lifecycle needs a precise term for "a superseded node that nothing functional points at anymore" — the state that makes a node safe to archive or remove. Today that concept has no name, and the word "orphaned" is overloaded: `query orphaned` means "zero relationships", while `validate` reports an "orphaned relationship" for a link whose target is missing.

## What Changes

- **BREAKING** Rename `query orphaned` (items with zero relationships) to `query isolated`.
- Introduce `orphaned` as a graph query: an effectively superseded item with no incoming functional (non-history) links.
- Rename the `validate` "orphaned relationship" diagnostic to "dangling reference" (a link whose target no longer exists).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `cli-query`: `query orphaned` takes the new "superseded + unreferenced" meaning; the zero-relationship query becomes `query isolated`.
- `cli-validate`: the missing-target diagnostic is renamed "dangling reference".
- `traceable-item-supersession`: adds the derived "orphaned" state.

## Impact

- `src/TraceabilityGraph.ts` — new `isOrphaned()`; rename orphaned-relationship diagnostic wording
- `src/cli.ts` — `query isolated` (renamed) and `query orphaned` (new)
- Tests: `test/query-command.test.ts`, `test/graph-and-api.test.ts`, `test/cli.test.ts`
- Docs: `reference/cli.adoc`, `how-to/query-graph.adoc`, `reference/traceability-macros.adoc`
