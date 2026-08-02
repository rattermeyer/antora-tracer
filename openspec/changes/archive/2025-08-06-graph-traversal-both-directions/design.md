## Context

`TraceabilityGraph.toDot(fromId, depth)` generates a GraphViz DOT string by BFS-traversing the graph from `fromId`. Currently it only follows outgoing edges via `_relationshipIndex`. The graph API already supports bidirectional traversal — `getImpactAnalysis`, `findPath`, and `getRelatedItems` all use both `getRelationships` (outgoing) and `getReverseRelationships` (incoming). `toDot` is the outlier.

## Goals / Non-Goals

**Goals:**
- `toDot` traverses both outgoing and incoming relationships
- Edge direction in DOT output reflects the actual relationship direction (e.g., ARC-002 → REQ-001 for `addresses`)
- Existing DOT node/edge formatting preserved

**Non-Goals:**
- Changing the Vega-Lite coverage charts
- Changing the macro syntax or Antora extension glue code
- Adding configuration to control traversal direction (always bidirectional now)

## Decisions

### Decision: Mirror the `getImpactAnalysis` pattern

`getImpactAnalysis` already does what we want — it enqueues both outgoing and incoming neighbors:

```typescript
for (const rel of this.getRelationships(current)) { ... }     // outgoing
for (const rel of this.getReverseRelationships(current)) { ... } // incoming
```

The fix adds the same reverse-relationship loop to `toDot`'s BFS. For each incoming relationship `rel` (where `rel.targetId === current.id`):

- Add edge: `{ from: rel.fromId, to: current.id, label: type }`
- Enqueue `rel.fromId` if not visited

This preserves correct edge direction — the DOT arrow shows the actual relationship direction (e.g., ARC-002 → REQ-001 for `addresses`).

### Decision: No API change

The method signature stays `toDot(fromId: string, depth = 1): string`. Callers don't change. The behavior change is transparent — graphs just show more nodes.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Larger graphs (more nodes, more edges) at the same depth | Acceptable — users explicitly request the depth. If anything, it makes the depth parameter more meaningful. |
| Existing test expectations may break | Update tests to reflect the new, correct behavior. The deeper graph is the intended behavior. |
| Potential cycles cause infinite loops | Already handled — `visited` set prevents revisiting nodes. |
