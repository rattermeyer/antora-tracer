## ADDED Requirements

### Requirement: Role-based relation validation

The system SHALL validate that relations between items are allowed based on their roles, as defined in the configuration.

#### Scenario: Valid relation between roles
- **WHEN** a requirement with role `requirement` has a relation `addresses` to a design with role `design`
- **AND** the configuration allows `requirement` to `design` via `addresses`
- **THEN** system accepts the relation
- **AND** system adds it to the traceability graph

#### Scenario: Invalid relation between roles
- **WHEN** a requirement with role `requirement` has a relation `implements` to a test with role `test`
- **AND** the configuration does NOT allow `requirement` to `test` via `implements`
- **THEN** system generates an error
- **AND** error message lists allowed relations from `requirement` to `test`

#### Scenario: Relation between unknown roles
- **WHEN** an item with unknown role `X` has a relation to an item with unknown role `Y`
- **THEN** system generates a warning
- **AND** system does NOT validate the relation type
- **AND** system continues processing

### Requirement: Configuration defines allowed relations

The configuration file SHALL define which relation types are allowed between which role pairs.

#### Scenario: Configuration with relation definitions
- **WHEN** configuration defines `relations: { requirement: { design: [addresses, satisfies] } }`
- **THEN** system allows `addresses` and `satisfies` relations from `requirement` to `design`
- **AND** system rejects any other relation type between these roles

#### Scenario: Missing relation definition
- **WHEN** configuration does not define relations for a role pair
- **THEN** system treats all relations between those roles as invalid
- **AND** system generates error for any relation between them

### Requirement: Relation validation uses source role

The system SHALL use the source item's role to determine which relations are allowed to the target item's role.

#### Scenario: Directional relation validation
- **WHEN** item A (role=requirement) has relation `addresses` to item B (role=design)
- **THEN** system checks if `requirement` can have `addresses` relation to `design`
- **AND** system does NOT check if `design` can have `addresses` relation to `requirement`

#### Scenario: Reverse direction relation
- **WHEN** item A (role=design) has relation `addresses` to item B (role=requirement)
- **THEN** system checks if `design` can have `addresses` relation to `requirement`
- **AND** this may have different allowed relations than the reverse direction

### Requirement: Error messages include allowed relations

Error messages for invalid relations SHALL include the list of allowed relations between the source and target roles.

#### Scenario: Error message for invalid relation
- **WHEN** a user tries to use relation `implements` from `requirement` to `test`
- **AND** this is not allowed in the configuration
- **THEN** error message includes: "Relation 'implements' not allowed from requirement to test. Allowed: [verified_by, validated_by]"

### Requirement: Warnings for unknown roles in relations

The system SHALL generate warnings (not errors) when relations involve items with unknown roles.

#### Scenario: Source role is unknown
- **WHEN** item A has unknown role `X` and relation `relates` to item B with known role `requirement`
- **THEN** system generates a warning
- **AND** warning message indicates which role is unknown
- **AND** system continues processing

#### Scenario: Target role is unknown
- **WHEN** item A has known role `requirement` and relation `relates` to item B with unknown role `Y`
- **THEN** system generates a warning
- **AND** warning message indicates which role is unknown
- **AND** system continues processing
