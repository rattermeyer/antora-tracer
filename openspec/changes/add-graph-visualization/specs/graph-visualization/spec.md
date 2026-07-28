## ADDED Requirements

### Requirement: Relationship graph via traceability:graph[] macro
The system SHALL provide a `traceability:graph[]` inline macro that renders a GraphViz relationship graph for the enclosing item. The graph SHALL show the item and its direct relationships as labeled nodes and edges, colored by role. An optional depth parameter SHALL control the number of hops.

#### Scenario: Graph renders for an item with relationships
- **WHEN** an item block contains `traceability:graph[]` and `:traceability-graph:` is enabled
- **THEN** the macro expands to a Kroki GraphViz image showing the item and its related items
- **AND** items are colored by role (e.g., requirement=blue, design=green, test=red)
- **AND** edges are labeled with the relationship type

#### Scenario: Graph stripped when attribute is absent
- **WHEN** `:traceability-graph:` is not set
- **THEN** `traceability:graph[]` is removed from visible output

#### Scenario: Depth parameter controls hops
- **WHEN** `traceability:graph[2]` is used with depth 2
- **THEN** the graph shows items within 2 hops of the enclosing item

### Requirement: Coverage chart via traceability:graph-coverage[] macro
The system SHALL provide a `traceability:graph-coverage[]` inline macro that renders a Vega-Lite bar chart showing coverage. When used inside an item block, it SHALL show per-relationship-type coverage for that item. When used outside an item block, it SHALL show global coverage by role.

#### Scenario: Per-item coverage chart
- **WHEN** an item block contains `traceability:graph-coverage[]`
- **THEN** the macro expands to a Kroki Vega-Lite bar chart
- **AND** bars show which relationship types are satisfied and which are missing

#### Scenario: Global coverage chart
- **WHEN** `traceability:graph-coverage[]` appears outside any item block
- **THEN** the macro expands to a global coverage chart showing items per role with covered/uncovered segments

### Requirement: Graph visualization methods on TraceabilityGraph
The `TraceabilityGraph` SHALL provide `toDot(fromId, depth?)` returning a GraphViz DOT source string, and `toVegaLite(itemId?)` returning a Vega-Lite JSON specification.

#### Scenario: toDot generates valid DOT
- **WHEN** `toDot("REQ-001")` is called with an item that has relationships
- **THEN** a valid GraphViz DOT string is returned
- **AND** the DOT string contains the item, its related items as nodes, and relationships as edges

#### Scenario: toVegaLite with item generates per-item chart
- **WHEN** `toVegaLite("REQ-001")` is called
- **THEN** a valid Vega-Lite JSON spec is returned with bars for each relationship type

#### Scenario: toVegaLite without item generates global chart
- **WHEN** `toVegaLite()` is called without an item ID
- **THEN** a valid Vega-Lite JSON spec is returned with bars grouped by role and colored by coverage status

### Requirement: Dashboard page in example site
The example site SHALL include a dashboard page with a global coverage chart and select per-item relationship graphs, gated by the `:traceability-graph:` attribute.

#### Scenario: Dashboard page renders with graphs
- **WHEN** the dashboard page is built with `:traceability-graph: true`
- **THEN** the page contains a global coverage bar chart
- **AND** the page contains relationship graphs for selected items
- **AND** graphs are rendered as Kroki images visible in both HTML and PDF
