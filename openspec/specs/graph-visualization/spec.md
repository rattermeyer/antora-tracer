## Purpose

Render traceability relationships, coverage, and configuration as diagrams — GraphViz DOT and Vega-Lite — served through Kroki, via the `traceability:graph[]`, `traceability:graph-coverage[]`, and `traceability:config-graph[]` macros.
## Requirements
### Requirement: Relationship graph via traceability:graph[] macro
The system SHALL provide a `traceability:graph[]` inline macro that renders a relationship diagram for the enclosing item. The diagram SHALL show the item and its related items as labeled nodes and edges, colored by role. An optional depth parameter SHALL control the number of relationship hops shown.

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
The system SHALL provide a `traceability:graph-coverage[]` inline macro that renders a coverage chart. When used inside an item block, it SHALL show per-relationship-type coverage for that item. When used outside an item block, it SHALL show global coverage by role.

#### Scenario: Per-item coverage chart
- **WHEN** an item block contains `traceability:graph-coverage[]`
- **THEN** the macro expands to a Kroki Vega-Lite bar chart
- **AND** bars show which relationship types are satisfied and which are missing

#### Scenario: Global coverage chart
- **WHEN** `traceability:graph-coverage[]` appears outside any item block
- **THEN** the macro expands to a global coverage chart showing items per role with covered/uncovered segments

### Requirement: Graph model supports traversal-bounded subgraph and coverage queries
The graph model SHALL support producing a traversal-bounded relationship subgraph for a given item, traversing both outgoing and incoming directions. Bidirectional relationships SHALL be visually distinguishable from one-directional relationships in the rendered output. The graph model SHALL also support producing coverage data for a given item, or globally across all items.

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

#### Scenario: toDot renders bidirectional edge with distinct style
- **WHEN** `toDot("UC-003")` is called and `UC-003 leads_to REQ-001` is marked `bidirectional: true`
- **THEN** the edge from UC-003 to REQ-001 SHALL be rendered with `dir=both` and `style=dashed`

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

### Requirement: Configurable Kroki image format
The `krokiImageFormat` extension config option SHALL control the image format (`svg` or `png`) used in rendered relationship diagram images. When not set, the format SHALL default to `svg`. The configured `krokiServerUrl` (or its default `https://kroki.io`) SHALL be used as the base URL for diagram rendering requests.

#### Scenario: Default format is SVG
- **WHEN** `krokiImageFormat` is not set in the extension config
- **THEN** Kroki URLs SHALL use `svg` format

#### Scenario: PNG format for PDF builds with default server
- **WHEN** `krokiImageFormat: png` is set in the playbook extension config
- **AND** `krokiServerUrl` is not configured
- **THEN** `traceability:graph[]` SHALL generate `image::https://kroki.io/graphviz/png/...[]` URLs

#### Scenario: PNG format with custom server URL
- **WHEN** `krokiImageFormat: png` and `krokiServerUrl: http://localhost:8000` are set
- **THEN** `traceability:graph[]` SHALL generate `image::http://localhost:8000/graphviz/png/...[]` URLs

### Requirement: Configuration graph via traceability:config-graph[] macro
The system SHALL provide a `traceability:config-graph[]` macro that renders the effective traceability configuration as a Kroki GraphViz diagram. The diagram SHALL show each configured role as a node colored by role and each declared relation as a labeled edge, using declared directions only.

#### Scenario: Macro renders roles and declared relations
- **WHEN** a page sets `:traceability-graph:` and contains `traceability:config-graph[]`
- **THEN** the macro expands to a Kroki GraphViz image
- **AND** the diagram contains one node per configured role
- **AND** the diagram contains one edge per declared relation, labeled with the relation type(s)

#### Scenario: Declared directions only
- **WHEN** the config declares `design` to `requirement` with relation `addresses` and `inverseLabels` maps `addresses` to `addressed-by`
- **THEN** the diagram shows only the `design` to `requirement` edge labeled `addresses`
- **AND** no `addressed-by` edge from `requirement` to `design` appears

#### Scenario: Orphaned role appears as isolated node
- **WHEN** a role is declared in `roles` but appears in no `relations` entry
- **THEN** the role still appears as a node in the diagram with no edges

#### Scenario: Reflects merged preset configuration
- **WHEN** the configuration extends a preset
- **THEN** the diagram reflects the merged roles and relations from the preset plus overrides

#### Scenario: Macro stripped when attribute absent
- **WHEN** `:traceability-graph:` is not set
- **THEN** `traceability:config-graph[]` is removed from visible output

### Requirement: Config graph generator renders configuration as DOT
The system SHALL provide a DOT generator for the traceability configuration that renders roles as nodes and declared relations as labeled edges.

#### Scenario: toConfigDot generates valid DOT
- **WHEN** `toConfigDot(config)` is called with a config containing roles and relations
- **THEN** a valid GraphViz DOT string is returned
- **AND** the DOT string contains a node for each role
- **AND** the DOT string contains an edge for each declared relation labeled with its relation types

#### Scenario: Self-loops preserved
- **WHEN** a role declares a relation to itself, such as `requirement` to `requirement` with type `refines`
- **THEN** the DOT output contains a self-loop edge for that role

#### Scenario: Isolated role node
- **WHEN** a config declares a role in `roles` with no entry in `relations`
- **THEN** the DOT output contains a node for that role with no edges

