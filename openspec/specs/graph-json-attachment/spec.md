# graph-json-attachment

## Purpose

Register a per-version JSON snapshot of the traceability graph as a site attachment alongside the generated matrices, so each published component version carries a machine-readable record of its items and relationships.

## Requirements

### Requirement: Graph JSON snapshot is registered per component version
The system SHALL serialize each component version's traceability graph to a JSON snapshot and register it as a site attachment at `traceability/graph.json` during the `contentClassified` event, before document conversion, so the published site carries a machine-readable graph per version.

#### Scenario: Snapshot is registered when a version has items
- **WHEN** the `contentClassified` event fires and a component version has traceable items
- **THEN** a `graph.json` attachment is added to the content catalog for that component version
- **AND** it is registered under every module that has AsciiDoc content

#### Scenario: No traceable items
- **WHEN** a component version has no traceable items
- **THEN** no `graph.json` attachment is registered

#### Scenario: A committed copy is refreshed in place
- **WHEN** an attachment at the same component, version, module, and relative path already exists
- **THEN** its contents are replaced with the freshly generated snapshot
- **AND** no duplicate attachment error is raised

### Requirement: Snapshot uses the canonical graph format
The generated `graph.json` SHALL contain the item and relationship lists in the canonical snapshot format: a top-level `format` field, the component and version, and every item carrying its `id`, `role`, `title`, `content`, `status`, `attributes`, `component`, `module`, `version`, `sourceFile`, and `sourceLine`. The snapshot SHALL NOT include per-page `pubUrl` fields.

#### Scenario: Snapshot round-trips the graph
- **WHEN** a component version's graph is serialized
- **THEN** the snapshot SHALL contain every item and every relationship of that version
- **AND** each item SHALL preserve its `component`, `module`, and `version` scope

#### Scenario: pubUrl is excluded
- **WHEN** a component version's graph is serialized
- **THEN** no item in the snapshot SHALL carry a `pubUrl` field

### Requirement: Graph JSON is gated by matrix generation
The graph JSON snapshot SHALL be emitted only when matrix generation is enabled, so it is produced wherever matrices are and nowhere matrices are not.

#### Scenario: Disabled when matrices are disabled
- **WHEN** `generateMatrices` is false
- **THEN** no `graph.json` attachment is registered

### Requirement: Unversioned components produce a snapshot
The system SHALL emit a `graph.json` snapshot for a component version with an empty-string version, matching how matrices and the overview are registered for unversioned content.

#### Scenario: Empty-string version
- **WHEN** the site builds a component version with an empty-string version and traceable items
- **THEN** a `graph.json` attachment is registered for that version
