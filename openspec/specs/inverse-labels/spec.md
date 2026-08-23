# inverse-labels

## Purpose

Relation display names are config-driven and display-only: they affect rendering text, never graph structure, merge behavior, or validation.

## Requirements

### Requirement: Relation display names are configurable
The system SHALL support `labels` in the traceability configuration YAML, mapping each relation type to a human-readable display name used for rendering (incoming/outgoing lists, matrix headers, graph labels).

#### Scenario: Config-defined label used
- **WHEN** `traceability.yml` defines `labels: { leads_to: "Leads to" }`
- **AND** a page renders an item's `leads_to` relationships
- **THEN** the rendered output shows "Leads to" as the group heading

#### Scenario: Incoming view uses the reverse type's label
- **WHEN** `relations` declares `leads_to` with reverse `is_derived_from`
- **AND** `labels` defines `is_derived_from: "Is derived from"`
- **AND** a page uses `traceability:incoming[]` on a requirement that is the target of a `leads_to` edge
- **THEN** the rendered output shows "Is derived from" as the group heading

### Requirement: Labels do not affect the graph
`labels` SHALL NOT affect graph structure, merge behavior, or validation.

### Requirement: Default display name is the humanized type
If a relation type has no entry in `labels`, the system SHALL display the type name humanized: underscores replaced with spaces and the result sentence-cased.

#### Scenario: Default humanized label
- **WHEN** a relation type `is_derived_from` has no `labels` entry
- **THEN** the rendered output shows "Is derived from" as the display name

### Requirement: No compile-time fallback
The system SHALL NOT consult a compile-time inverse map for display names; the pairing between primary and reverse types is derived solely from the `reverse` declaration in `relations`, and display text comes solely from `labels` or the humanized default.

#### Scenario: Removed type renders as its raw humanized name
- **WHEN** a relation type has no `labels` entry
- **THEN** the humanized type name is displayed, and no compile-time inverse map is consulted
