## Why

When a user writes both `leads_to:REQ-001[]` in UC-003 and the inverse `is_derived_from:UC-003[]` in REQ-001, the graph stores two separate directed relationships instead of recognizing they form one bidirectional pair. This double-counts in coverage stats, triggers false circular-reference warnings, shows duplicate arrows in GraphViz output, and exports redundant edges to Neo4j.

## What Changes

- **TraceabilityGraph.addRelationship** detects when a new relationship is the inverse of an already-stored relationship (matching via `inverseLabels` config) and merges them into a single relationship marked as bidirectional
- **ItemRelationship** gains a `bidirectional` flag so downstream consumers (Neo4j, GraphViz, validation) can handle merged pairs correctly
- **Circular reference detection** skips bidirectional pairs — they are legitimate, not cycles
- **_inverseIndex** (declared but never populated) is removed as dead code

## Capabilities

### New Capabilities
- `bidirectional-relationship-merge`: Auto-merge complementary directed relationships into a single bidirectional edge when an inverse type mapping exists in config

### Modified Capabilities
- `circular-reference-detection`: Circular reference validator skips relationships marked as bidirectional, since A→B and B→A with complementary types is not a cycle
- `graph-visualization`: `toDot()` may optionally render bidirectional edges with a different arrow style

## Impact

- `src/TraceabilityGraph.ts` — `addRelationship` logic, remove dead `_inverseIndex`
- `src/types.ts` — add `bidirectional?: boolean` to `ItemRelationship`
- `src/Neo4jExporter.ts` — optionally export bidirectional flag on edges
- `test/graph-and-api.test.ts` — new test cases for merge behavior
