## ADDED Requirements

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
