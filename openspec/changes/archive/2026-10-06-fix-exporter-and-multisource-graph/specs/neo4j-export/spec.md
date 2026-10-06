## ADDED Requirements

### Requirement: Neo4j exports preserve scoped item identity
Neo4j exports from a playbook SHALL distinguish items by component, version when present, and item ID, so items with the same ID from different component versions remain distinct. Exports from unscoped local input SHALL continue to identify items by bare ID.

#### Scenario: CSV preserves cross-component nodes and relationships
- **WHEN** a playbook contains same-ID items and relationships in multiple components and is exported as CSV
- **THEN** the node data SHALL distinguish each item's component-qualified identity
- **AND** relationship endpoints SHALL refer to the corresponding scoped nodes

#### Scenario: Cypher preserves cross-version nodes and relationships
- **WHEN** a playbook contains same-ID items in multiple versions of a component and is exported as Cypher
- **THEN** the export SHALL create distinct nodes for those scoped items
- **AND** relationship endpoints SHALL refer to the corresponding scoped nodes

#### Scenario: Local input retains bare-ID identity
- **WHEN** an unscoped local directory is exported to either Neo4j format
- **THEN** items SHALL retain their bare-ID identity
