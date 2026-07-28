## ADDED Requirements

### Requirement: Collapsible list-style output via document attribute
The system SHALL support a `:traceability-collapsible:` document attribute that, when set to a truthy value, wraps each relation-type group in list-style output in a `[%collapsible]` AsciiDoc block.

#### Scenario: Collapsible enabled
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: list` (or default)
- **THEN** each relation-type group renders as a `[%collapsible]` block with the relation type as the title and the links as the block body

#### Scenario: Collapsible disabled (default)
- **WHEN** `:traceability-collapsible:` is absent or set to a non-truthy value
- **THEN** list-style output renders as flat blocks (existing behavior, no collapsible wrapping)

#### Scenario: Collapsible with table style has no effect
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: table`
- **THEN** the table renders without collapsible wrapping (table style is unaffected)

#### Scenario: Collapsible with inline style has no effect
- **WHEN** `:traceability-collapsible: true` and `:traceability-style: inline`
- **THEN** the inline output renders without collapsible wrapping (inline style is unaffected)
