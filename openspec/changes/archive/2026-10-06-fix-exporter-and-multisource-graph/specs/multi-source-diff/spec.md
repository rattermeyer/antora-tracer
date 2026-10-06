## ADDED Requirements

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
