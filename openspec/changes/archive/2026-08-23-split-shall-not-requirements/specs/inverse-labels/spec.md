## REMOVED Requirements

### Requirement: Relation display names are config-driven

## ADDED Requirements

### Requirement: Relation display names are configurable
The system SHALL support `labels` in the traceability configuration YAML, mapping each relation type to a human-readable display name used for rendering.

#### Scenario: Config-defined label is used
- **WHEN** `traceability.yml` defines `labels: { leads_to: "Leads to" }`
- **THEN** the rendered output SHALL use "Leads to" for that relation type

### Requirement: Labels do not affect the graph
`labels` SHALL NOT affect graph structure, merge behavior, or validation.

#### Scenario: Labels are display-only
- **WHEN** a `labels` entry is present or absent
- **THEN** graph structure, merge behavior, and validation SHALL be unaffected
