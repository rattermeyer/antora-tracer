# reverse-relations

## Purpose

A relation SHALL be declared once with a mandatory reverse name, so that the two authorable names of a single reversible edge are co-located, the reverse direction is derived for validation, and authoring either name produces the same canonical edge.

## Requirements

### Requirement: Relations are declared keyed with a mandatory reverse
The `relations` config SHALL map `sourceRole → targetRole → relationType → { reverse }`, where `reverse` is required and names the authorable reverse relation type.

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

### Requirement: Authoring the reverse name canonicalizes to the primary edge
When an item authors a relationship using a reverse type, the graph SHALL store the canonical primary edge (primary direction and primary type), not the reverse-authored form.

#### Scenario: Reverse name authored from the opposite side
- **WHEN** a requirement authors `is_derived_from:UC-001[]`
- **AND** `leads_to` is the primary type for `use_case → requirement` with reverse `is_derived_from`
- **THEN** the stored edge SHALL be `UC-001 → REQ-001 : leads_to`
- **AND** no `is_derived_from`-typed edge SHALL be stored

#### Scenario: Primary name authored is stored as-is
- **WHEN** a use case authors `leads_to:REQ-001[]`
- **THEN** the stored edge SHALL be `UC-001 → REQ-001 : leads_to`

### Requirement: Reverse direction is derived for validation
`isRelationAllowed` SHALL allow a relation type that is the reverse of a relation declared in the opposite role direction, without an explicit `relations` entry for that direction.

#### Scenario: Reverse type passes validation without a second declaration
- **WHEN** config declares only `relations.use_case.requirement.leads_to.reverse = is_derived_from`
- **AND** an item authors `requirement → use_case : is_derived_from`
- **THEN** the relation SHALL be considered allowed
- **AND** no `invalid_relation` warning SHALL be emitted

#### Scenario: Unrelated type in the reverse direction is still rejected
- **WHEN** config declares only `relations.use_case.requirement.leads_to.reverse = is_derived_from`
- **AND** an item authors `requirement → use_case : validated_by`
- **THEN** the relation SHALL be rejected as not allowed

### Requirement: Matrix coverage matches the canonical primary type
A matrix `coverageRelations` entry SHALL name the canonical primary type, and a single entry SHALL count a relationship regardless of which name was authored.

#### Scenario: Reverse-authored link is counted
- **WHEN** config declares `leads_to` with reverse `is_derived_from`
- **AND** a matrix has `rows: requirement`, `columns: [use_case]`, `coverageRelations.use_case: [leads_to]`
- **AND** a requirement authored `is_derived_from:UC-001[]`
- **THEN** the matrix cell for the requirement and `UC-001` SHALL be linked (not missing)
