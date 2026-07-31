## ADDED Requirements

### Requirement: Use-case role extends self-traceability preset
The example site SHALL demonstrate config extension by adding a `use_case` role not present in any built-in preset, with a directional `leads_to` relation to `requirement`.

#### Scenario: Config extends preset with new role
- **WHEN** `examples/traceability.yml` defines `use_case` in roles and `use_case → requirement: [leads_to]` in relations
- **THEN** items with `role=use_case` are accepted by the extension
- **AND** `UC-XXX leads_to REQ-XXX` relations are validated as allowed
- **AND** `REQ-XXX leads_to UC-XXX` is rejected (directional)

#### Scenario: Use-case items trace to requirements
- **WHEN** a use-case item body contains `leads_to:REQ-001[]`
- **THEN** the relationship is registered in the graph
- **AND** the `usecase-requirements` matrix shows the coverage link

### Requirement: Use-case page renders with traceability links
The `use-cases.adoc` page SHALL render `traceability:outgoing[]` and `traceability:incoming[]` macros for each use-case item, showing its requirement links.

#### Scenario: Outgoing links from a use case
- **WHEN** UC-001 has `leads_to:REQ-001[]` through `leads_to:REQ-004[]`
- **THEN** the page shows four requirement links under "Leads to"

### Requirement: usecase-requirements matrix is generated
The example site SHALL generate a `usecase-requirements` matrix with use-case rows, requirement columns, and `leads_to` coverage.

#### Scenario: Matrix generation
- **WHEN** the site build completes
- **THEN** `matrix-usecase-requirements.html` and `.csv` exist in the traceability output
- **AND** the nav includes a link to the matrix
