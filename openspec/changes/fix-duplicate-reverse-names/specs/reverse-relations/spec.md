## MODIFIED Requirements

### Requirement: Relations are declared keyed with a mandatory reverse
The `relations` config SHALL map `sourceRole → targetRole → relationType → { reverse }`, where `reverse` is required and names the authorable reverse relation type. A reverse name SHALL identify exactly one primary: two relations SHALL NOT declare the same `reverse` name for different primaries.

#### Scenario: Reverse declaration pairs two types
- **WHEN** config declares `relations.use_case.requirement.leads_to.reverse = is_derived_from`
- **THEN** `leads_to` SHALL be the primary type for `use_case → requirement`
- **AND** `is_derived_from` SHALL be the reverse type

#### Scenario: Symmetric relation declares itself as its own reverse
- **WHEN** config declares `relations.requirement.requirement.conflicts_with.reverse = conflicts_with`
- **THEN** the relation SHALL be valid
- **AND** authoring `conflicts_with` from either direction SHALL produce the same edge

#### Scenario: Missing reverse is rejected
- **WHEN** a relation type is declared without a `reverse` value
- **THEN** configuration validation SHALL fail with an error naming the relation type

#### Scenario: Conflicting reverse name is rejected
- **WHEN** two relations declare the same `reverse` name but different primaries
- **THEN** configuration validation SHALL fail with an error naming the reverse name and both `sourceRole → targetRole` pairs

#### Scenario: Reused reverse name for the same primary is accepted
- **WHEN** two relations declare the same `(primary, reverse)` pair under different role pairs
- **THEN** configuration validation SHALL accept it
- **AND** the reverse name SHALL resolve to that primary
