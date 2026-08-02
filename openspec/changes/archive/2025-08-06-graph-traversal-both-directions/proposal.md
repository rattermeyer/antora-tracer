## Why

`traceability:graph[UC-001, 3]` fails to display `ARC-002` in the rendered graph, even though `ARC-002 addresses REQ-001` and `UC-001 leads_to REQ-001`. The `toDot` method's BFS traversal only follows outgoing relationships (`_relationshipIndex`), ignoring incoming relationships (`_reverseRelationshipIndex`). This makes the graph incomplete whenever items connect via incoming edges — which is the common case when architecture items address requirements that are linked from use cases.

## What Changes

- `TraceabilityGraph.toDot()`: BFS loop modified to traverse both outgoing and incoming relationships, matching the behavior of `getImpactAnalysis()` which already follows both directions
- Graph nodes connected via incoming edges (e.g., ARC-002 → REQ-001) now appear in the output

## Capabilities

### Modified Capabilities

- `graph-visualization`: `toDot` now traverses relationships in both directions, so `traceability:graph[]` renders the complete subgraph around an item including items connected via incoming edges.

## Impact

- **File modified**: `src/TraceabilityGraph.ts` — `toDot` method (~12 lines added)
- **Tests**: Existing `toDot` tests in `test/TraceabilityGraph.test.ts` may need updated expectations for deeper graphs
- **No API changes**: Method signature unchanged; existing callers (`antora-extension.ts`, `cli.ts`) unaffected
