## MODIFIED Requirements

### Requirement: Graph visualization methods on TraceabilityGraph
The `TraceabilityGraph` SHALL provide `toDot(fromId, depth?)` returning a GraphViz DOT source string, and `toVegaLite(itemId?)` returning a Vega-Lite JSON specification. The `toDot` method SHALL traverse relationships in both outgoing and incoming directions, showing the complete subgraph around an item.

#### Scenario: toDot generates valid DOT with bidirectional traversal
- **WHEN** `toDot("REQ-001")` is called with an item that has both outgoing and incoming relationships
- **THEN** a valid GraphViz DOT string is returned
- **AND** the DOT string contains nodes for items connected via outgoing edges
- **AND** the DOT string contains nodes for items connected via incoming edges
- **AND** edge direction reflects the actual relationship direction

#### Scenario: toDot includes architecture items addressing a requirement
- **WHEN** `toDot("REQ-001", 2)` is called and `ARC-002 addresses REQ-001` exists
- **THEN** `ARC-002` SHALL appear as a node in the DOT output
- **AND** an edge SHALL exist from `ARC-002` to `REQ-001` labeled `addresses`

#### Scenario: toDot with depth 0 shows only the source node
- **WHEN** `toDot("REQ-001", 0)` is called
- **THEN** only `REQ-001` appears as a node with no edges
