# multi-source-diff

## Purpose

Build the complete cross-source traceability graph from an Antora playbook without site output, serialize it to a JSON snapshot, and diff two snapshots with component-qualified item identity.

## Requirements

### Requirement: Full cross-source graph is built without site output
The tooling SHALL build the complete traceability graph for a playbook's aggregated content — spanning all content sources, components, and versions — without generating HTML, PDF, or DOCX output.

#### Scenario: graph built from a multi-source playbook
- **WHEN** a consumer builds the site graph for a playbook with multiple content sources
- **THEN** the resulting graph SHALL contain the items and relationships from every content source
- **AND** no site output SHALL be written

### Requirement: Harvested items carry component, module, and version scope
When items are harvested from a playbook, each item SHALL record the component, module, and version of the content source it came from, so the diff can disambiguate same-ID items.

#### Scenario: harvested item carries its scope
- **WHEN** an item is harvested from component `foo`, module `ROOT`, version `main`
- **THEN** the item SHALL record `component` as `foo`, `module` as `ROOT`, and version as `main`

### Requirement: Graph snapshots serialize to JSON
A harvested graph SHALL serialize to a canonical JSON snapshot containing the item and relationship lists, with each item carrying its scope fields, so a snapshot can be stored and diffed later.

#### Scenario: snapshot round-trips item scope
- **WHEN** a harvested graph is serialized to a JSON snapshot
- **THEN** the snapshot SHALL contain every item and relationship
- **AND** each item SHALL preserve its `component`, `module`, and version fields

### Requirement: Two snapshots can be diffed without checkouts
The tooling SHALL diff two JSON snapshots — reporting added, removed, modified, and superseded items — without requiring either version's sources to be checked out at diff time.

#### Scenario: cross-repo added and removed items
- **WHEN** snapshot A and snapshot B differ in items across two content sources
- **THEN** the delta SHALL report the added and removed items from both sources

#### Scenario: superseded pair across snapshots
- **WHEN** an item in snapshot A is superseded by an item in snapshot B
- **THEN** the delta SHALL report the predecessor as removed and the successor as added
- **AND** SHALL report the `supersedes` relationship as a new relationship

### Requirement: Diff matches items by component-qualified identity
The diff SHALL match items by component-qualified identity — component, version when present, and ID — so the same ID in different components or versions is not conflated, while items without a component continue to match by bare ID.

#### Scenario: same ID in different components is distinct
- **WHEN** snapshot A contains `REQ-001` in component `foo`
- **AND** snapshot B contains `REQ-001` in component `bar`
- **THEN** the delta SHALL report the `foo` item as removed and the `bar` item as added
- **AND** SHALL NOT report a modified item

### Requirement: Cross-source graphs preserve component-qualified item identity
A graph harvested from an Antora playbook SHALL preserve separate items that share an ID but belong to different component or version scopes. Items without component scope SHALL continue to use bare-ID identity.

#### Scenario: Same ID in different component scopes
- **WHEN** a playbook contains `REQ-001` in components `foo` and `bar`
- **THEN** the graph SHALL contain both items as distinct nodes

#### Scenario: Same ID in different versions
- **WHEN** a playbook contains `REQ-001` in different versions of the same component
- **THEN** the graph SHALL contain both items as distinct nodes

#### Scenario: Duplicate definition within one scope
- **WHEN** a playbook contains repeated definitions of `REQ-001` in the same component and version
- **THEN** the graph SHALL treat them as the same scoped identity and SHALL NOT create a second node

### Requirement: Cross-source relationships retain scoped endpoints
A relationship in a harvested graph SHALL connect the items identified by its source and target references within the applicable component and version scope. Equal bare IDs in other scopes SHALL NOT cause an endpoint to resolve to the wrong item.

#### Scenario: Same relationship IDs in separate components
- **WHEN** components `foo` and `bar` each contain items `REQ-001` and `TEST-001` and a relationship from `TEST-001` to `REQ-001`
- **THEN** each relationship SHALL connect the two items in its own component scope
- **AND** neither relationship SHALL connect to an item from the other component
