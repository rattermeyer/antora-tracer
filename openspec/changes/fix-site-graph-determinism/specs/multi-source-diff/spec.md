## MODIFIED Requirements

### Requirement: Graph snapshots serialize to JSON
A harvested graph SHALL serialize to a canonical JSON snapshot containing the item and relationship lists, with each item carrying its scope fields, so a snapshot can be stored and diffed later. The snapshot SHALL be deterministic: harvesting an unchanged tree twice SHALL produce the same items and relationships in the same order, with reverse-authored relations stored in their primary direction.

#### Scenario: snapshot round-trips item scope
- **WHEN** a harvested graph is serialized to a JSON snapshot
- **THEN** the snapshot SHALL contain every item and relationship
- **AND** each item SHALL preserve its `component`, `module`, and version fields

#### Scenario: two harvests of an unchanged tree are identical
- **WHEN** the site graph is harvested twice from the same playbook and tree
- **THEN** the two snapshots SHALL contain the same items and relationships in the same order
- **AND** diffing them SHALL report no changes

#### Scenario: a reverse-authored relation stores its primary direction
- **WHEN** an item authors a reverse relation type whose endpoint is defined in another file
- **AND** the authoring file is harvested before the file that defines the endpoint
- **THEN** the stored relationship SHALL use the primary type and direction
- **AND** the direction SHALL NOT depend on the order the files were harvested
